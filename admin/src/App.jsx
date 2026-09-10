import React, { useCallback, useEffect, useState } from 'react';
import { completeSignIn, signIn, signOut, storedToken } from './auth.js';
import { ApiError, getFlags, getMe, setFlag } from './api.js';

// What each flag actually turns on, in the words of somebody deciding whether
// to flip it. The API returns keys only; it has no business carrying copy.
const DESCRIPTIONS = {
  spot_notes: 'The comment thread on a spot page. Accepts text from anyone signed in.',
  spot_description_edits: 'Lets a rider rewrite a spot description. Every edit is kept as a revision.',
  spot_community_photos: 'Shows photos from public sessions logged at the spot on its page.',
};

export default function App() {
  const [state, setState] = useState('loading');
  const [error, setError] = useState(null);
  const [me, setMe] = useState(null);
  const [flags, setFlags] = useState([]);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    try {
      const [who, settings] = await Promise.all([getMe(), getFlags()]);
      setMe(who);
      setFlags(settings.flags);
      setState('ready');
    } catch (err) {
      // 403 with admin_required is a working sign-in that is not in the group,
      // which is a different screen from a dead session - and the single most
      // likely state on a first visit, because nothing adds you to the group.
      if (err instanceof ApiError && err.status === 403 && err.body.admin_required) {
        setState('not-admin');
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        setState('anon');
        return;
      }
      setError(err.message);
      setState('error');
    }
  }, []);

  useEffect(() => {
    completeSignIn()
      .then((consumed) => {
        if (!consumed && !storedToken()) {
          setState('anon');
          return null;
        }
        return load();
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
  }, [load]);

  async function toggle(flag) {
    setPending(flag.key);
    setError(null);
    try {
      const saved = await setFlag(flag.key, !flag.enabled);
      // Rendered from the response, not from the click. set() busts its cache
      // before returning, so this is the value the API will serve next.
      setFlags((current) =>
        current.map((f) => (f.key === saved.key ? { ...f, enabled: saved.enabled } : f))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }

  if (state === 'loading') {
    return <div className="wrap"><p className="muted">Checking your session…</p></div>;
  }

  if (state === 'anon') {
    return (
      <div className="wrap">
        <h1>Glazewave admin</h1>
        <p className="muted">Sign in with your Glazewave account.</p>
        <p><button className="plain" onClick={signIn}>Sign in</button></p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (state === 'not-admin') {
    return (
      <div className="wrap">
        <h1>Not an admin</h1>
        <p className="muted">
          You are signed in, but your account is not in the <code>admins</code> group.
          Membership is added with <code>admin-add-user-to-group</code> and only
          reaches the token at the next sign-in.
        </p>
        <p><button className="plain" onClick={signOut}>Sign out</button></p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="wrap">
        <h1>Glazewave admin</h1>
        <div className="error">{error}</div>
        <p><button className="plain" onClick={signOut}>Sign out</button></p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>Glazewave admin</h1>
          <div className="muted">Signed in as {me.username}</div>
        </div>
        <button className="plain" onClick={signOut}>Sign out</button>
      </header>

      {error && <div className="error">{error}</div>}

      <h2>Feature flags</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Live immediately. The API caches a flag for 30 seconds, but a flip clears
        that key, so the only stale reader is a request already in flight.
      </p>

      <div className="card">
        {flags.map((flag) => (
          <div className="flag" key={flag.key}>
            <div>
              <h2>{flag.key.replace(/_/g, ' ')}</h2>
              <div className="muted">{DESCRIPTIONS[flag.key] || <code>{flag.key}</code>}</div>
            </div>
            <button
              className="toggle"
              data-on={String(flag.enabled)}
              disabled={pending === flag.key}
              aria-pressed={flag.enabled}
              aria-label={`${flag.enabled ? 'Disable' : 'Enable'} ${flag.key}`}
              onClick={() => toggle(flag)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
