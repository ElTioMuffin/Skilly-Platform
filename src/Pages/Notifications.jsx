import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api/notifications/";

function Notifications() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("skillyUser") || "null");
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}?user=${user.id}`);
      if (!response.ok) throw new Error("No se pudieron cargar las notificaciones.");
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await fetch(`${API_URL}${notification.id}/mark_read/?user=${user.id}`, { method: "POST" });
    }
    navigate(notification.link);
  };

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <Link to="/" className="back-link">← Volver al inicio</Link>
        <header className="notifications-header">
          <span className="section-label">SKILLY</span>
          <h1>Notificaciones</h1>
          <p>Alertas de nuevas solicitudes y actividad de tu cuenta.</p>
        </header>

        {error && <div className="booking-message booking-message-error">{error}</div>}
        {!error && notifications.length === 0 && (
          <div className="notifications-empty">Todavía no tienes notificaciones.</div>
        )}
        <div className="notifications-list">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`notification-item${notification.is_read ? "" : " unread"}`}
              onClick={() => openNotification(notification)}
            >
              <span className="notification-indicator" aria-hidden="true" />
              <span className="notification-copy">
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{new Date(notification.created_at).toLocaleString("es-CL")}</small>
              </span>
              <span className="notification-open">Ver solicitud →</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Notifications;
