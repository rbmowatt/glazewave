import React, { useEffect, useState } from 'react';
import { getFlags, setFlag } from './api.js';

// What each flag turns on, in the words of somebody deciding whether to flip
// it. The API returns keys only; it has no business carrying copy.
const DESCRIPTIONS = {
  spot_notes: 'The comment thread on a spot page. Accepts text from anyone signed in.',
  spot_description_edits: 'Lets a rider rewrite a spot description. Every edit is kept as a revision.',
  spot_community_photos: 'Shows photos from public sessions logged at the spot on its page.',
};

export default function Flags({ onError }) {
  const [flags, setFlags] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    getFlags().then((data) => setFlags(data.flags)).catch((err) => onError(err.message));
  }, [onError]);

  async function toggle(flag) {
    setPending(flag.key);
    onError(null);
    try {
      const saved = await setFlag(flag.key, !flag.enabled);
      // Rendered from the response, not from the click. set() busts its cache
      // before returning, so this is the value the API will serve next.
      setFlags((current) =>
        current.map((f) => (f.key === saved.key ? { ...f, enabled: saved.enabled } : f))
      );
    } catch (err) {
      onError(err.message);
    } finally {
      setPending(null);
    }
  }

  if (!flags) return <p className="muted">Loading…</p>;

  return (
    <>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Live immediately. The API caches a flag for 30 seconds, but a flip clears
        that key, so the only stale reader is a request already in flight.
      </p>
      <div className="card">
        {flags.map((flag) => (
          <div className="row" key={flag.key}>
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
    </>
  );
}
