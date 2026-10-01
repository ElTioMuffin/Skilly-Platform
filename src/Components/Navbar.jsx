import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const storedUser = localStorage.getItem("skillyUser");
  const isLoggedIn = !!storedUser;

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;
  const storedProfile = localStorage.getItem("skillyProfile");
  const profile = storedProfile ? JSON.parse(storedProfile) : null;

  const isAdmin = user?.is_staff === true;
  const isProfessional = profile?.role === "professional";

  useEffect(() => {
    if (!isProfessional || !user?.id) {
      setUnreadCount(0);
      return undefined;
    }
    const loadUnread = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/notifications/?user=${user.id}`
        );
        if (!response.ok) return;
        const data = await response.json();
        const notifications = Array.isArray(data) ? data : data.results || [];
        setUnreadCount(notifications.filter((item) => !item.is_read).length);
      } catch {
        // Keep navigation usable if notifications are temporarily unavailable.
      }
    };
    loadUnread();
    const interval = window.setInterval(loadUnread, 5000);
    return () => window.clearInterval(interval);
  }, [isProfessional, user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("skillyUser");
    localStorage.removeItem("skillyProfile");

    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/mi-perfil")
  }

  return (
    <header className="navbar">

      <div className="navbar-container">

        <Link
          to="/"
          className="navbar-logo"
        >
          SKILLY
        </Link>


        <nav className="navbar-menu">

          <Link
            to={isAdmin ? "/admin" : "/"}
          >
            Inicio
          </Link>

          <Link
            to="/marketplace"
            className="active-link"
          >
            Profesionales
          </Link>

          <Link to="/como-funciona">
            Cómo funciona
          </Link>

          {isLoggedIn && !isAdmin && !isProfessional && (
            <Link to="/mis-reservas">
              Mis Reservas
            </Link>
          )}
          {isLoggedIn && isProfessional && (
            <>
              <Link to="/horarios">Mi disponibilidad</Link>
              <Link to="/reservas-recibidas">Reservas recibidas</Link>
              <Link to="/servicios">Servicios</Link>
              <Link to="/notificaciones" className="navbar-notifications-link">
                Notificaciones
                {unreadCount > 0 && <span className="navbar-notification-count">{unreadCount}</span>}
              </Link>
              </>
          )}
          {isAdmin && (
            <Link to="/admin/incidencias">
              Incidencias
            </Link>
          )}

        </nav>


        <div className="navbar-actions">

          {isProfessional ? (
            <button
              type="button"
              className="logout-button"
              onClick={handleProfile}
            >
              Editar Perfil
            </button>
          ) : (<></>) }

          {isLoggedIn ? (


            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>

          ) : (

            <>
              <Link
                to="/login"
                className="login-link"
              >
                Iniciar sesión
              </Link>

              <Link
                to="/registro"
                className="register-button"
              >
                Registrarse
              </Link>
            </>

          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;
