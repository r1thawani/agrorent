// FILE: agrorent/src/components/ErrorBoundary.jsx
import { Component } from "react";

// App-wide safety net. Without this, one component that throws during render
// (e.g. a page handed a data shape it doesn't expect) unmounts the whole
// React tree and leaves a blank white screen with nothing but a console
// error. This catches that, keeps the rest of the shell (Navbar/Footer)
// alive, and gives the user a way out.
//
// It only does anything when a render actually throws — normal pages are
// rendered untouched as children.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Left as console for now — swap for a real logger/Sentry call later.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  handleReload = () => {
    // Full reload is the simplest reliable recovery: it re-runs the initial
    // Supabase session check and remounts every provider from scratch.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "0.5px solid #E0E8E3",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#555555", marginBottom: "20px" }}>
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#FF5C00",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
