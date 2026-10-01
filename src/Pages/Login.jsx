import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.username || !formData.password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        {
          username: formData.username,
          password: formData.password,
        }
      );

      console.log("Login correcto:", response.data);


      // Guardamos los datos básicos del usuario
      localStorage.setItem(
        "skillyUser",
        JSON.stringify(response.data.user)
      );

      // Guardamos el perfil si existe
      if (response.data.profile) {
        localStorage.setItem(
          "skillyProfile",
          JSON.stringify(response.data.profile)
        );
      }

      if (response.data.user.is_staff) {

        navigate("/admin");

      } else {

        navigate("/marketplace");

      }

    } catch (error) {

      console.error("Error en el login:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError(
          "No fue posible conectarse con el servidor."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      <div className="login-container">

        <section className="login-header">

          <span className="section-label">
            SKILLY
          </span>

          <h1>
            Iniciar sesión
          </h1>

          <p>
            Accede a tu cuenta de Skilly.
          </p>

        </section>


        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <div className="form-group">

            <label htmlFor="username">
              Usuario o correo electrónico
            </label>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="Ingresa tu usuario o correo"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>


          <div className="login-register">

            <span>
              ¿No tienes una cuenta?
            </span>

            <Link to="/registro">
              Crear cuenta
            </Link>

          </div>

        </form>

      </div>

    </main>
  );
}

export default Login;