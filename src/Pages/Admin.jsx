import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";



function Admin() {

  const [metrics, setMetrics] = useState(null);
  useEffect(() => {

    fetch(
      "http://localhost:8000/api/admin/dashboard/metrics/"
    )

      .then(res => res.json())

      .then(data => {

        setMetrics(data);

      })


  }, []);
  if (!metrics) {

    return (

      <main className="admin-page">

        <h2>
          Cargando dashboard...
        </h2>

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
                Validaciones
              </h3>

              <p>
                {metrics.pending_validations}&nbsp;
                pendientes de revisión
              </p>

            </div>




            <div className="admin-card">


              <h3>
                Servicios
              </h3>

              <p>
                {metrics.active_services}&nbsp;
                servicios activos
              </p>

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
                Validar perfiles
              </h3>


              <p>
                Revisa documentos,
                aprueba profesionales
                y controla el KYC.
              </p>


              <Link
                to="/admin/validaciones"
                className="user-card-button"
              >
                Gestionar →
              </Link>


            </div>





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