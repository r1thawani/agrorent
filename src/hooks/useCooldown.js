import { useCallback, useEffect, useState } from "react";

// A short "please wait" lock for forms. After Supabase says "rate limit",
// every further click just extends the lockout, so the submit button stays
// disabled with a visible countdown instead of inviting more clicks.
//
//   const { secondsLeft, start } = useCooldown();
//   if (isRateLimitError(err)) start(30);
//   <button disabled={secondsLeft > 0}>…</button>
export function useCooldown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= Date.now()) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [until]);

  const start = useCallback((seconds) => {
    const t = Date.now();
    setNow(t);
    setUntil(t + seconds * 1000);
  }, []);

  return { secondsLeft: Math.max(0, Math.ceil((until - now) / 1000)), start };
}
