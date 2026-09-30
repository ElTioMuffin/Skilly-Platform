import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "professional",
    profession: "",
    location: "",
    bio: "",
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

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.full_name
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/registro/",
        formData
      );

      console.log("Registro correcto:", response.data);

      alert("Cuenta creada correctamente. Ahora puedes iniciar sesión.");

      navigate("/login");

    } catch (error) {

      console.error("Error en el registro:", error);

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
            Crear cuenta
          </h1>

          <p>
            Regístrate para comenzar a usar Skilly.
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

            <label htmlFor="full_name">
              Nombre completo *
            </label>

            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Tu nombre completo"
              value={formData.full_name}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="username">
              Nombre de usuario *
            </label>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="Ej: juanperez"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="email">
              Correo electrónico *
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="tucorreo@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="password">
              Contraseña *
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Crea una contraseña"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="role">
              Tipo de cuenta *
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >

              <option value="professional">
                Profesional
              </option>

              <option value="organization">
                Organización
              </option>

            </select>

          </div>


          {formData.role === "professional" && (

            <div className="form-group">

              <label htmlFor="profession">
                Profesión
              </label>

              <input
                id="profession"
                name="profession"
                type="text"
                placeholder="Ej: Diseñador UX/UI"
                value={formData.profession}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

          )}


          <div className="form-group">

            <label htmlFor="location">
              Ubicación
            </label>

            <input
              id="location"
              name="location"
              type="text"
              placeholder="Ej: Santiago"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
            />

          </div>


          <div className="form-group">

            <label htmlFor="bio">
              Sobre ti
            </label>

            <textarea
              id="bio"
              name="bio"
              placeholder="Cuéntanos brevemente sobre ti..."
              value={formData.bio}
              onChange={handleChange}
              disabled={loading}
              rows="4"
            />

          </div>


          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>


          <div className="login-register">

            <span>
              ¿Ya tienes una cuenta?
            </span>

            <Link to="/login">
              Iniciar sesión
            </Link>

          </div>

        </form>

      </div>

    </main>
  );
}

export default Registro;