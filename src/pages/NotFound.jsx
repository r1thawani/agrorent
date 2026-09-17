import { Link } from "react-router-dom";
import { Tractor } from "lucide-react";

export default function NotFound() {
  return (
    <div className="pt-14 min-h-screen bg-page flex items-center justify-center text-center px-6 py-14">
      <div>
        <div className="w-16 h-16 rounded-full bg-orange-tint flex items-center justify-center mx-auto mb-5">
          <Tractor size={28} className="text-orange" />
        </div>
        <h1 className="text-[48px] font-semibold text-green-dark leading-none">404</h1>
        <p className="text-base font-medium text-ink mt-3">
          This page took a wrong turn in the field.
        </p>
        <p className="text-sm text-ink-muted mt-1.5">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex gap-3 justify-center mt-7">
          <Link
            to="/"
            className="px-7 py-3 rounded-lg bg-orange text-white text-[13px] font-medium no-underline"
          >
            Back to home
          </Link>
          <Link
            to="/listings"
            className="px-7 py-3 rounded-lg border-[1.5px] border-orange text-orange text-[13px] font-medium no-underline"
          >
            Browse equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
