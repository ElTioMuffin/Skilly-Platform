import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/api/notifications/";

function Notifications() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skillyUser") || "null");
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const requestInFlight = useRef(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id || requestInFlight.current) {
      if (!user?.id) setLoading(false);
      return;
    }
    requestInFlight.current = true;
    try {
      const response = await fetch(`${API_URL}?user=${user.id}`);
      if (!response.ok) throw new Error("No se pudieron cargar las notificaciones.");
      const data = await response.json();
      const items = Array.isArray(data) ? data : data?.results;
      if (!Array.isArray(items)) throw new Error("El servidor devolvió las notificaciones con un formato inesperado.");
      setNotifications(items);
      setError("");
    } catch (err) {
      setError(err.message || "No se pudieron cargar las notificaciones.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    setOpeningId(notification.id);
    setError("");
    try {
      if (!notification.is_read) {
        const response = await fetch(`${API_URL}${notification.id}/mark_read/?user=${user.id}`, { method: "POST" });
        if (!response.ok) throw new Error("No se pudo marcar la notificación como leída.");
      }
    } catch (err) {
      setError(err.message || "No se pudo actualizar la notificación.");
    } finally {
      setOpeningId(null);
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
        {loading && <div className="notifications-empty">Cargando notificaciones...</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className="notifications-empty">Todavía no tienes notificaciones.</div>
        )}
        <div className="notifications-list">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`notification-item${notification.is_read ? "" : " unread"}`}
              onClick={() => openNotification(notification)}
              disabled={openingId === notification.id}
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
