import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";



function Admin() {

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadMetrics = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/admin/dashboard/metrics/",
        { signal }
      );
      if (!response.ok) {
        throw new Error(`El servidor respondió con un error (${response.status}).`);
      }
      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("El servidor devolvió un resumen con formato inesperado.");
      }
      setMetrics(data);
    } catch (requestError) {
      if (signal.aborted) return;
      setError(requestError.message || "No se pudo cargar el panel.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal);
    return () => controller.abort();
  }, [loadMetrics, reloadKey]);

  if (!metrics) {

    return (

      <main className="admin-page">

        {loading ? (
          <h2>Cargando dashboard...</h2>
        ) : (
          <section className="section-container" role="alert">
            <h2>No se pudo cargar el panel.</h2>
            <p>{error || "No hay datos disponibles."}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Intentar de nuevo
            </button>
          </section>
        )}

      </main>

    )

  }


  return (

    <main className="admin-page">



      <section className="about-section">

        <div className="section-container">

          <span className="section-label">
            RESUMEN GENERAL
          </span>


          <h2>
            Estado actual
            <br />
            de la plataforma.
          </h2>



          <div className="admin-stats">


            <div className="admin-card">

              <h3>
                Profesionales
              </h3>

              <p>
                {metrics.professionals}&nbsp;
                profesionales registrados
              </p>

            </div>
            <div className="admin-card">


              <h3>
                Servicios
              </h3>

              <p>
                {metrics.active_services}&nbsp;
                servicios aprobados y disponibles
              </p>
              <small>
                {metrics.pending_services || 0} pendientes de aprobación
              </small>

              <Link
                to="/admin/servicios"
                className="user-card-button"
              >
                Revisar servicios →
              </Link>

            </div>




            <div className="admin-card">


              <h3>
                Solicitudes
              </h3>

              <p>
                {metrics.requests}&nbsp;
                solicitudes realizadas
              </p>

            </div>


          </div>


        </div>


      </section>




      {/* MÓDULOS ADMIN */}

      <section className="how-section">


        <div className="section-container">


          <span className="section-label">
            BACK-OFFICE
          </span>


          <h2>
            Herramientas de gestión.
          </h2>



          <div className="steps-grid">



            <div className="step-card">



              <h3>
                Incidencias
              </h3>


              <p>
                Gestiona reclamos,
                conflictos y seguimiento.
              </p>


              <Link
                to="/admin/incidencias"
                className="user-card-button"
              >
                Revisar →
              </Link>


            </div>





            <div className="step-card">



              <h3>
                Métricas
              </h3>


              <p>
                Analiza uso,
                ingresos y desempeño.
              </p>


              <Link
                to="/admin/metricas"
                className="user-card-button"
              >
                Ver datos →
              </Link>


            </div>




          </div>


        </div>


      </section>





      {/* CTA */}

      <section className="cta-section">


        <div className="cta-content">


          <h2>
            Construyendo confianza
            <br />
            dentro de Skilly.
          </h2>


          <p>
            Controla la calidad del marketplace.
          </p>


        </div>


      </section>



    </main>

  );

}


export default Admin;
