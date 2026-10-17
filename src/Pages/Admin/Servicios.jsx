import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Validaciones.css";

const API_URL = "http://127.0.0.1:8000/api/admin/services/";

function ServiciosPendientes() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPendingServices = useCallback(async () => {
    const token = localStorage.getItem("skillyAdminToken");

    if (!token) {
      setServices([]);
      setError("No hay una sesión administrativa activa. Cierra sesión y vuelve a entrar con la cuenta administrativa.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}pending/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("skillyAdminToken");
          throw new Error(data?.error || "La sesión administrativa venció. Vuelve a iniciar sesión.");
        }
        throw new Error(data?.error || `No se pudieron cargar los servicios pendientes (HTTP ${response.status}).`);
      }

      if (!Array.isArray(data)) {
        throw new Error("El servidor no devolvió una lista de servicios. Revisa que el backend esté actualizado.");
      }

      setServices(data);
    } catch (requestError) {
      setServices([]);
      setError(`${requestError.message} Comprueba que el backend esté ejecutándose en el puerto 8000.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingServices();
  }, [loadPendingServices]);

  const approveService = async (serviceId) => {
    const token = localStorage.getItem("skillyAdminToken");
    setBusyId(serviceId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}${serviceId}/review/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo aprobar el servicio.");
      }
      setServices((current) => current.filter((service) => service.id !== serviceId));
      setMessage("Servicio aprobado. Si está activo, ya puede aparecer en el marketplace.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="admin-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-label">SKILLY ADMIN</span>
          <h1>Revisión de servicios.</h1>
          <p>Aprueba las publicaciones antes de que estén disponibles para las organizaciones.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="section-container">
          <Link to="/admin">← Volver al panel</Link>
          <span className="section-label">SERVICIOS PENDIENTES</span>
          <h2>{services.length} por revisar</h2>

          {error && <p className="service-queue-alert" role="alert">{error}</p>}
          {message && <p className="service-queue-message" role="status">{message}</p>}
          {loading && <p role="status">Cargando servicios pendientes...</p>}

          <button
            type="button"
            className="approve-button"
            onClick={loadPendingServices}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar lista"}
          </button>

          {!loading && !error && services.length === 0 && (
            <p>No hay servicios pendientes de aprobación.</p>
          )}

          <div className="validation-grid">
            {services.map((service) => (
              <article className="validation-card" key={service.id}>
                <span className="admin-number">Servicio #{service.id}</span>
                <h3>{service.name}</h3>
                <p>{service.description || "Sin descripción."}</p>
                <div className="profile-info">
                  <p><span>Profesional</span>{service.professional_name}</p>
                  <p><span>Especialidad</span>{service.professional_profession || "Sin especificar"}</p>
                  <p><span>Categoría</span>{service.category}</p>
                  <p><span>Precio</span>${Number(service.price).toLocaleString("es-CL")}</p>
                  <p><span>Estado</span>{service.active ? "Activo" : "Pausado"}</p>
                </div>
                <div className="validation-buttons">
                  <button
                    className="approve-button"
                    disabled={busyId === service.id}
                    onClick={() => approveService(service.id)}
                  >
                    {busyId === service.id ? "Aprobando..." : "Aprobar servicio"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServiciosPendientes;
