/*
 * Authorization code + PKCE against the Cognito hosted UI.
 *
 * Hand-rolled rather than amazon-cognito-identity-js: the pool client is a
 * public SPA client (generate_secret = false) with the code flow already
 * enabled, so this is the whole integration, and the library is what drags
 * aws-sdk v2 and its node polyfills into the bundle - the exact thing that
 * makes the CRA app unupgradable.
 *
 * The ACCESS token is what talks to the API. cognitoAuth accepts both, but
 * only the access token carries client_id where the verifier looks for it and
 * the scope claim it reads with .split(' ').
 *
 * The refresh token is deliberately NOT kept. Cognito returns one and this
 * throws it away, so a session lasts the access token's hour and then asks for
 * a sign-in again. A refresh token in browser storage is a persistent key to
 * an account that can flip live features; an hour of clicking is not worth it.
 */

const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Derived, not configured, so the same build works on localhost and in
// production. Both spellings have to be in the client's callback_urls.
const REDIRECT_URI = `${window.location.origin}/admin/callback`;

const TOKEN_KEY = 'gw_admin_token';
const VERIFIER_KEY = 'gw_admin_verifier';
const STATE_KEY = 'gw_admin_state';

const base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

async function challengeFor(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(digest);
}

export function storedToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw);
    // A minute of slack, so a request started just under the wire does not
    // land after expiry and read as a permissions problem.
    if (!token.expires_at || token.expires_at - 60_000 < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token.access_token;
  } catch (err) {
    return null;
  }
}

export function signOut() {
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.assign(
    `${DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(window.location.origin + '/admin/')}`
  );
}

export async function signIn() {
  const verifier = randomString();
  const state = randomString();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 'S256',
  });
  window.location.assign(`${DOMAIN}/oauth2/authorize?${params}`);
}

/*
 * Called once on load. Returns true when it consumed a code from the URL, so
 * the caller knows to re-read the token rather than show the sign-in button.
 */
export async function completeSignIn() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return false;

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  // Cleared before anything can throw, so a failed exchange does not leave a
  // code in the address bar to be replayed by a refresh.
  window.history.replaceState({}, '', '/admin/');

  if (!expectedState || url.searchParams.get('state') !== expectedState) {
    throw new Error('Sign-in state did not match. Start again.');
  }
  if (!verifier) {
    throw new Error('Sign-in was started in another tab. Start again.');
  }

  // Form-encoded, not JSON. The Cognito token endpoint answers
  // invalid_request to a JSON body without saying which field it disliked.
  const res = await fetch(`${DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    })
  );
  return true;
}
