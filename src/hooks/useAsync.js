import { useCallback, useEffect, useState } from "react";

// Standard "load data on mount" wiring, in one place.
//
// Almost every page in this app repeats the same block: a `data` / `loading`
// / `error` trio of useState, a useEffect that calls a service, `.then` to
// store the result, `.catch` to store an error, `.finally` to drop the
// loading flag — plus a guard so a slow response from a previous render
// doesn't overwrite newer state after the inputs changed.
//
// `useAsync` is that block. It does NOT change how any existing page behaves;
// it's opt-in for pages that want to stop hand-rolling the pattern:
//
//   const { data: listings, loading, error, reload } =
//     useAsync(() => equipmentService.getAll(), []);
//
//   const { data: bookings, loading } = useAsync(
//     () => bookingService.getMyBookings(user.id),
//     [user?.id],
//     { enabled: !!user, initialData: [] },
//   );
//
// - asyncFn:     a function returning a promise. Re-run whenever `deps` change
//                (pass it inline; it is intentionally not itself a dep).
// - deps:        dependency array, same rules as useEffect.
// - enabled:     when false, nothing runs and loading stays false (use it to
//                wait for `user` etc). Defaults to true.
// - initialData: value for `data` before the first successful load.
export function useAsync(asyncFn, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    // `ignore` flips true when deps change or the component unmounts, so a
    // late-resolving promise from a stale run can't overwrite fresh state.
    let ignore = false;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(asyncFn)
      .then(
        (result) => {
          if (!ignore) {
            setData(result);
            setLoading(false);
          }
        },
        (err) => {
          if (!ignore) {
            setError(err);
            setLoading(false);
          }
        },
      );
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadTick, ...deps]);

  return { data, error, loading, reload, setData };
}
