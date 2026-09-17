import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-border/50 rounded-xl p-8 max-w-[420px] w-full text-center">
          <h1 className="text-lg font-medium text-ink mb-2">Something went wrong</h1>
          <p className="text-sm text-ink-muted mb-5">
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="h-11 px-5 rounded-lg border-none bg-orange text-white text-sm font-medium cursor-pointer"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
