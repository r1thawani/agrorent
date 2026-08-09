import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Fixes two related navigation bugs:
//
// 1. "How it works" / any `#section` link only ever lands on Home, never
//    scrolls to the section — because React Router's BrowserRouter does not
//    do browser-style hash scrolling on its own. Clicking <Link to="/#how-it-works">
//    just renders "/" and leaves scroll position wherever it was (or at the
//    top). This component watches the route, and if there's a hash, scrolls
//    the target section into the vertical center of the viewport so it's the
//    clear focal point, rather than just peeking in at the very top edge.
//
// 2. Normal SPA route changes (e.g. Home -> Listings) don't reset scroll
//    position at all, so if you'd scrolled down on one page, the next page
//    can render already scrolled halfway down. This resets to the top for
//    any navigation that isn't targeting a hash.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      // Wait a tick so the target page has actually rendered (important when
      // navigating from a different route, not just within the same page).
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
