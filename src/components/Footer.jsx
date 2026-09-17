import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-green-dark pt-10 pb-6">
      <div className="w-[90%] max-w-[1100px] mx-auto">

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-20 mb-8">

          <div className="flex-1 flex flex-col items-start">
            <p className="text-white font-semibold text-base mb-2">AgroRent</p>
            <p className="text-green-tint-2 text-sm leading-relaxed">Rent the equipment.<br />Grow the harvest.</p>
          </div>

          <div className="flex-1 flex flex-col items-start sm:items-center">
            <p className="text-white font-semibold text-base mb-2">Links</p>
            <div className="flex flex-col">
              <Link to="/listings" className="text-green-tint-2 text-sm no-underline leading-relaxed">Browse Equipment</Link>
              <Link to="/#how-it-works" className="text-green-tint-2 text-sm no-underline leading-relaxed">How It Works</Link>
              <Link to="/post-listing" className="text-green-tint-2 text-sm no-underline leading-relaxed">List Your Equipment</Link>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-start sm:items-end">
            <p className="text-white font-semibold text-base mb-2">Support</p>
            <div className="flex flex-col items-start sm:items-end">
              <Link to="/contact" className="text-green-tint-2 text-sm no-underline leading-relaxed">Contact</Link>
              <Link to="/privacy" className="text-green-tint-2 text-sm no-underline leading-relaxed">Privacy Policy</Link>
              <Link to="/terms" className="text-green-tint-2 text-sm no-underline leading-relaxed">Terms of Service</Link>
            </div>
          </div>

        </div>

        <div className="border-t border-white/15 pt-5">
          <p className="text-green-tint-2 text-[13px] text-center">
            © 2025 AgroRent. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
