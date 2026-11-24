import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import StatCard from "../../components/dashboard/StatCard";
import ActivityCard from "../../components/dashboard/ActivityCard";

export default function Overview({ user: propUser }) {
  const [stats, setStats] = useState(null);
  const [reading, setReading] = useState(null);
  const [orders, setOrders] = useState(null);
  const [currentUser, setCurrentUser] = useState(propUser || null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      let user = propUser;
      if (!user) {
        try {
          user = await dashboardApi.getCurrentUser();
          if (!cancelled) setCurrentUser(user);
        } catch {
          user = null;
        }
      } else {
        setCurrentUser(user);
      }

      const userId = user?.id || "demo-user";

      try {
        const [s, r, ords] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getContinueReading(),
          dashboardApi.getUserOrders(userId),
        ]);

        if (cancelled) return;
        setStats(s);
        setReading(r);
        setOrders(ords);
      } catch (err) {
        console.error("Erreur chargement Overview :", err);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [propUser]);

  if (!stats) return <p className="hv-loading">Loading your universe…</p>;

  return (
    <div>
      <div className="hv-stats">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} />
        ))}
      </div>

      <h2 className="hv-section-title">Continue Reading</h2>
      {reading && (
        <ActivityCard
          title={reading.title}
          chapter={reading.chapter}
          progress={reading.progress}
          sc={reading.sc}
          st={reading.st}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 12 }}>
        <h2 className="hv-section-title" style={{ margin: 0 }}>Commandes récentes</h2>
        {currentUser?.id && (
          <span className="hv-tag" title={`Commandes de l'utilisateur : ${currentUser.id}`}>
            USER ID: {currentUser.id.length > 14 ? `${currentUser.id.slice(0, 8)}...` : currentUser.id}
          </span>
        )}
      </div>

      {!orders || orders.length === 0 ? (
        <p className="hv-loading" style={{ padding: "20px 0" }}>Aucune commande trouvée pour cet utilisateur.</p>
      ) : (
        <div className="hv-orders-list">
          {orders.map((order) => {
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Récemment";

            const isSuccess =
              order.status === "success" || order.payment?.status === "paid";

            return (
              <div key={order._id || order.id} className="hv-order-card">
                <div className="hv-order-head">
                  <div>
                    <span className="hv-order-id">
                      #{String(order._id || order.id).slice(-6).toUpperCase()}
                    </span>
                    <span className="hv-order-date"> · {dateStr}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`hv-status ${isSuccess ? "watched" : "watching"}`}>
                      {isSuccess ? "Payée" : "En attente"}
                    </span>
                    <span className="hv-order-total">
                      {Number(order.total || 0).toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="hv-order-items">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="hv-order-item-row">
                      <span className="hv-order-item-qty">{item.quantity}x</span>
                      <span className="hv-order-item-name">{item.name}</span>
                      <span className="hv-order-item-price">
                        {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
