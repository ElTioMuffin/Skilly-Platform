import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("skillyUser");
  const isLoggedIn = !!storedUser;

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const isAdmin = user?.is_staff === true;

  const handleLogout = () => {
    localStorage.removeItem("skillyUser");
    localStorage.removeItem("skillyProfile");

    navigate("/login");
  };

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

          {isLoggedIn && !isAdmin && (
            <Link to="/mis-reservas">
              Mis Reservas
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/incidencias">
              Incidencias
            </Link>
          )}

        </nav>


        <div className="navbar-actions">

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