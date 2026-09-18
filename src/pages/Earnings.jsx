import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../hooks/useAuth";

const PAYOUT_CLASSES = {
  completed: "bg-green-tint text-green-dark",
  confirmed: "bg-orange-tint text-orange-dark",
};
const PAYOUT_LABELS = { completed: "Completed", confirmed: "Confirmed" };

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

function lastEightMonths() {
  const months = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("default", { month: "short" }) });
  }
  return months;
}

export default function Earnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    if (!user) return;
    bookingService.getRequestsForOwner(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user]);

  const earningBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const totalEarnings = earningBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const pendingPayout = bookings.filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const months = lastEightMonths();
  const monthlyData = months.map(({ key, label }) => {
    const amount = earningBookings.filter((b) => {
      const d = new Date(b.created_at);
      return `${d.getFullYear()}-${d.getMonth()}` === key;
    }).reduce((sum, b) => sum + Number(b.total_price), 0);
    return { month: label, amount };
  });
  const thisMonth = monthlyData[monthlyData.length - 1]?.amount || 0;

  const payoutHistory = earningBookings.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

  return (
    <div className="min-h-screen bg-page pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-8 flex flex-col lg:flex-row gap-6">
        <Sidebar activeLink="/earnings" />

        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-medium text-ink mb-5">Earnings</h1>

          {loading ? (
            <div className="text-center py-16 text-ink-muted">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <StatCard label="Total earnings" value={`K${totalEarnings.toLocaleString()}`} valueColor="#FF5C00" />
                <StatCard label="This month" value={`K${thisMonth.toLocaleString()}`} valueColor="#FF5C00" />
                <StatCard label="Balance due at pickup" value={`K${pendingPayout.toLocaleString()}`} />
              </div>

              <div className="bg-white rounded-xl p-5 mb-7 border border-border/50">
                <h2 className="text-[15px] font-medium text-ink mb-4">Monthly earnings</h2>
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
                          {new Date(b.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-ink flex-1">Booking for {b.equipment?.name}</span>
                        <span className="text-sm font-medium text-ink mr-3">K{Number(b.total_price).toLocaleString()}</span>
                        <PayoutStatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-ink-faint mb-7">
                Payout transfers to your mobile money account aren't set up yet — the figures above reflect booking value, not an actual completed bank transfer.
              </p>

              {!payoutRequested ? (
                <button
                  onClick={() => setPayoutRequested(true)}
                  className="px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-green border-none cursor-pointer mb-7"
                >
                  Request payout
                </button>
              ) : (
                <div className="text-[13px] text-green-dark bg-green-tint rounded-lg px-4 py-2.5 mb-7 inline-block">
                  Payout requested — you'll be notified once it's processed.
                </div>
              )}

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
