import React, { useCallback, useEffect, useState } from 'react';
import { completeSignIn, signIn, signOut, storedToken } from './auth.js';
import { ApiError, getMe } from './api.js';
import Flags from './Flags.jsx';
import Users from './Users.jsx';

const TABS = [
  { key: 'flags', label: 'Feature flags' },
  { key: 'users', label: 'Riders' },
];

export default function App() {
  const [state, setState] = useState('loading');
  const [error, setError] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('flags');

  const load = useCallback(async () => {
    try {
      setMe(await getMe());
      setState('ready');
    } catch (err) {
      // 403 with admin_required is a working sign-in that is not in the group,
      // which is a different screen from a dead session - and the most likely
      // state on a first visit, because nothing adds you to the group.
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

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className="tab"
            data-active={String(tab === t.key)}
            onClick={() => { setError(null); setTab(t.key); }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="error">{error}</div>}

      {/*
        Keyed on the tab so switching away and back refetches. These are two
        views of state somebody else may be changing, and a cached render of a
        flag that is no longer on is worse than a second of loading.
      */}
      {tab === 'flags' && <Flags key="flags" onError={setError} />}
      {tab === 'users' && <Users key="users" me={me} onError={setError} />}
    </div>
  );
}
