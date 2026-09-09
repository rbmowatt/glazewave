import axios from 'axios';
import apiConfig from './../../config/api.js';

/*
 * The demo session. Deliberately free of redux and of session.js: cognito.js
 * imports this so refresh() can branch, and session.js already imports
 * cognito.js. Reaching back for setSessionCookie here would close that loop and
 * leave one of the three modules holding undefined at import time.
 */

// CRA inlines REACT_APP_* at build time, so showing or hiding the button is a
// Mac rebuild and a committed frontend/build - not an env edit on the box. The
// backend's DEMO_PUBLIC is separate and runtime, and the two can disagree.
export const isDemoPublic = () => process.env.REACT_APP_DEMO_PUBLIC === '1';

const loginUrl = (key) =>
  apiConfig.host + apiConfig.port + '/api/demo/login' +
  (key ? '?k=' + encodeURIComponent(key) : '');

/*
 * The same shape formatSessionObject builds for a Cognito session, plus isDemo
 * and the key. Nothing reading state.session can tell the two apart, which is
 * the point - refresh() is the only place that has to.
 */
const formatDemoSession = (data, key) => ({
  user: {
    id: data.user.id,
    userName: data.user.username,
    email: data.user.email
  },
  jwt: data.token,
  groups: [],
  isAdmin: false,
  isDemo: true,
  // Unix seconds: hasSession() reads this with moment.unix().
  expiration: data.expires_at,
  // Kept so refresh() can replay the login an hour in. The visitor was handed
  // this key already; storing it grants nothing they did not have.
  demoKey: key || null,
  isLoggedIn: true
});

export const startDemoSession = (key = null) =>
  axios.post(loginUrl(key)).then(res => formatDemoSession(res.data, key));

export const storedSession = () => {
  try {
    const raw = localStorage.getItem('x-token');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    // A half-written or hand-edited x-token would otherwise throw inside
    // refresh(), which runs before the app has rendered anything.
    return null;
  }
};

export const isDemoSession = () => {
  const session = storedSession();
  return !!(session && session.isDemo);
};

/*
 * Every visitor signs into the same demo row, so its writes are refused server
 * side by middleware/DemoReadOnly. This hides the controls that would hit that
 * refusal - courtesy, not security: the token is in the browser and anyone can
 * replay it with curl.
 */
export const isReadOnly = (session) => !!(session && session.isDemo);
