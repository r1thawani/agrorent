import { useEffect, useRef, useState } from "react";

// Mock real-time connection hook for Messages/Conversation pages.
//
// There's no backend yet, so this does NOT open a real WebSocket — it just
// gives components the same shape a real one would (`connected`, `on`,
// `emit`) so the rest of the app can be written against a stable interface.
// When a real backend exists, swap the body of this hook for something like
// `io(SOCKET_URL)` from socket.io-client; callers using `useSocket()` won't
// need to change.
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const listeners = useRef({});

  useEffect(() => {
    // Simulate the brief handshake delay of a real socket connecting.
    const t = setTimeout(() => setConnected(true), 300);
    return () => {
      clearTimeout(t);
      setConnected(false);
    };
  }, []);

  function on(event, callback) {
    listeners.current[event] = listeners.current[event] || [];
    listeners.current[event].push(callback);
    return () => {
      listeners.current[event] = listeners.current[event].filter((cb) => cb !== callback);
    };
  }

  function emit(event, payload) {
    // No server round-trip in mock mode — just echo to local listeners so
    // UI built against `on()` still works during development/demo.
    (listeners.current[event] || []).forEach((cb) => cb(payload));
  }

  return { connected, on, emit };
}
