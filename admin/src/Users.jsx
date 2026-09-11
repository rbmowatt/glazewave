import React, { useCallback, useEffect, useState } from 'react';
import { getUsers, setUserActive } from './api.js';

const name = (u) => [u.first_name, u.last_name].filter(Boolean).join(' ') || null;

export default function Users({ me, onError }) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(null);

  const load = useCallback(() => {
    getUsers().then(setData).catch((err) => onError(err.message));
  }, [onError]);

  useEffect(load, [load]);

  async function toggle(user) {
    const active = !user.is_active;
    if (!active && !window.confirm(`Disable ${user.email || user.username}? They lose API access immediately.`)) {
      return;
    }
    setPending(user.id);
    onError(null);
    try {
      const saved = await setUserActive(user.id, active);
      setData((current) => ({
        ...current,
        users: current.users.map((u) => (u.id === saved.id ? { ...u, is_active: saved.is_active } : u)),
      }));
      // A partial success: the local flag moved and the pool call did not.
      // Surfaced as an error because "disabled" that leaves sign-in working is
      // not what the button says it did.
      if (saved.message) onError(saved.message);
    } catch (err) {
      onError(err.message);
    } finally {
      setPending(null);
    }
  }

  if (!data) return <p className="muted">Loading…</p>;

  return (
    <>
      {data.pool_unavailable && (
        <div className="warn">
          Cognito is not answering ({data.pool_unavailable}), so sign-in status is
          missing below. Disabling still locks the account out of the API, but it
          will not stop them signing in again. Usually the instance role has no
          cognito-idp permission yet.
        </div>
      )}

      <div className="card">
        {data.users.map((u) => (
          <div className="row" key={u.id}>
            <div>
              <h2>{u.email || u.username}</h2>
              <div className="muted">
                {name(u) && <>{name(u)} · </>}
                <code>#{u.id}</code>
                {u.cognito
                  ? <> · {u.cognito.status}{u.cognito.enabled ? '' : ' · sign-in disabled'}</>
                  : <> · no Cognito account</>}
                {!u.is_active && <> · <strong>disabled</strong></>}
              </div>
            </div>
            <button
              className="toggle"
              data-on={String(u.is_active)}
              disabled={pending === u.id || String(u.id) === String(me.id)}
              aria-pressed={u.is_active}
              aria-label={`${u.is_active ? 'Disable' : 'Enable'} ${u.username}`}
              title={String(u.id) === String(me.id) ? 'You cannot disable your own account' : undefined}
              onClick={() => toggle(u)}
            >
              <span />
            </button>
          </div>
        ))}
      </div>

      {/*
        Signed up at Cognito, no users row yet. Normal for the seconds between
        signup and the first firstOrNew call, and the first thing to look at
        when somebody says they registered and nothing works.
      */}
      {data.unlinked.length > 0 && (
        <>
          <h2 style={{ margin: '28px 0 4px' }}>No account row yet</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Registered with Cognito but never completed a first sign-in, so the app
            treats them as signed out.
          </p>
          <div className="card">
            {data.unlinked.map((u) => (
              <div className="row" key={u.username}>
                <div>
                  <h2>{u.email || u.username}</h2>
                  <div className="muted"><code>{u.username}</code> · {u.status}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.truncated && (
        <p className="muted">The pool returned more riders than this list fetched.</p>
      )}
    </>
  );
}
