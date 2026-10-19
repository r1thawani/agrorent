import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";
import { summarizeEarnings, lastMonths } from "../utils/earnings";
import { friendlyError } from "../utils/friendlyError";

const PAYOUT_CLASSES = {
  completed: "bg-green-tint text-green-dark",
  upcoming: "bg-orange-tint text-orange-dark",
};
const PAYOUT_LABELS = { completed: "Completed", upcoming: "Upcoming" };

function PayoutStatusBadge({ status }) {
  const cls = PAYOUT_CLASSES[status] || "bg-border text-ink-muted";
  return (
    <span className={`text-[11px] px-2.5 py-[3px] rounded-full font-medium ${cls}`}>
      {PAYOUT_LABELS[status] || status}
    </span>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex items-end gap-3.5 h-[180px]">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end">
          <div
            title={`K${d.amount.toLocaleString()}`}
            className="w-full max-w-[36px] bg-orange rounded-t"
            style={{ height: `${Math.max((d.amount / max) * 140, 6)}px` }}
          />
          <div className="text-[11px] text-ink-muted mt-2">{d.month}</div>
        </div>
      ))}
    </div>
  );
}

export default function Earnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    bookingService.getRequestsForOwner(user.id)
      .then(setBookings)
      .catch((err) => setLoadError(friendlyError(err, "Could not load your earnings.")))
      .finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toISOString().split("T")[0];
  const months = lastMonths(today);
  const summary = summarizeEarnings(bookings, today, months.map((m) => m.key));
  const monthlyData = months.map(({ key, label }) => ({ month: label, amount: summary.byMonth[key] }));

  const payoutHistory = summary.earning
    .slice()
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar activeLink="/earnings" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink mb-5">Earnings</h1>

          {loading ? (
            <div className="text-center py-16 text-ink-muted">Loading…</div>
          ) : loadError ? (
            <div className="text-center py-16 text-red">{loadError}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <StatCard label="Earned (completed rentals)" value={`K${summary.earned.toLocaleString()}`} valueColor="#FF5C00" />
                <StatCard label="Upcoming (confirmed rentals)" value={`K${summary.upcoming.toLocaleString()}`} />
                <StatCard label="To collect from renters at pickup" value={`K${summary.toCollectAtPickup.toLocaleString()}`} />
              </div>

              <div className="bg-white rounded-xl p-5 mb-7 border border-border/50">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-[15px] font-medium text-ink">Monthly earnings</h2>
                  <span className="text-[13px] text-ink-muted">This month: K{summary.thisMonth.toLocaleString()}</span>
                </div>
                <MiniBarChart data={monthlyData} />
              </div>

              <div className="mb-7">
                <h2 className="text-[15px] font-medium text-ink mb-4">Recent booking earnings</h2>
                {payoutHistory.length === 0 ? (
                  <div className="bg-white rounded-xl p-6 text-center text-sm text-ink-muted border border-border/50">
                    No earnings yet.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl overflow-hidden border border-border/50">
                    {payoutHistory.map((b, i) => (
                      <div
                        key={b.id}
                        className={`flex items-center px-4 py-3 ${i !== payoutHistory.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <span className="text-[13px] text-ink-muted w-[120px] shrink-0">
                          {new Date(b.start_date).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-ink flex-1">Booking for {b.equipment?.name}</span>
                        <span className="text-sm font-medium text-ink mr-3">K{b.ownerAmount.toLocaleString()}</span>
                        <PayoutStatusBadge status={b.earningStatus} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-ink-faint mb-7">
                Amounts are what you earn from each rental (price per day × days); AgroRent's 5% service fee
                is not included. Monthly figures are grouped by the month the rental starts. Payouts to mobile
                money aren't set up yet.
              </p>

              <div className="bg-white rounded-xl p-5 border border-border/50">
                <h2 className="text-[15px] font-medium text-ink mb-3">Your payout account</h2>
                <div className="text-sm text-ink">Not set up yet</div>
                <Link to="/profile/edit" className="text-[13px] text-green mt-2 inline-block no-underline">
                  Edit payout details
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
