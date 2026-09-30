import { Link } from "react-router-dom";

function ComoFunciona() {
  return (
    <main className="how-page">

      {/* ENCABEZADO */}

      <section className="how-hero">

        <div className="section-container">

          <span className="section-label">
            CÓMO FUNCIONA
          </span>

          <h1>
            Conecta talento.
            <br />
            Crea oportunidades.
          </h1>

          <p>
            Skilly conecta organizaciones y profesionales
            para encontrar, ofrecer y contratar servicios
            de manera simple y flexible.
          </p>

        </div>

      </section>


      {/* PASOS */}

      <section className="how-process">

        <div className="section-container">

          <span className="section-label">
            EL PROCESO
          </span>

          <h2>
            Así funciona Skilly.
          </h2>


          <div className="how-steps">

            <article className="how-step">

              <span className="how-step-number">
                01
              </span>

              <div>

                <h3>
                  Crea tu cuenta
                </h3>

                <p>
                  Regístrate en Skilly y selecciona
                  si quieres contratar profesionales
                  o ofrecer tus propios servicios.
                </p>

              </div>

            </article>


            <article className="how-step">

              <span className="how-step-number">
                02
              </span>

              <div>

                <h3>
                  Encuentra talento
                </h3>

                <p>
                  Explora profesionales según su
                  especialidad, servicio, modalidad
                  y ubicación.
                </p>

              </div>

            </article>


            <article className="how-step">

              <span className="how-step-number">
                03
              </span>

              <div>

                <h3>
                  Revisa el perfil
                </h3>

                <p>
                  Conoce sus servicios, información
                  profesional y las experiencias
                  compartidas por otros clientes.
                </p>

              </div>

            </article>


            <article className="how-step">

              <span className="how-step-number">
                04
              </span>

              <div>

                <h3>
                  Envía una solicitud
                </h3>

                <p>
                  Cuéntale al profesional qué necesitas,
                  indica tu presupuesto, fecha y modalidad
                  para comenzar el proyecto.
                </p>

              </div>

            </article>


            <article className="how-step">

              <span className="how-step-number">
                05
              </span>

              <div>

                <h3>
                  Conecta y trabaja
                </h3>

                <p>
                  El profesional revisa tu solicitud
                  y puede aceptarla o rechazarla.
                  Una vez aceptada, comienza el proyecto.
                </p>

              </div>

            </article>

          </div>

        </div>

      </section>


      {/* PROFESIONALES */}

      <section className="how-professional">

        <div className="section-container">

          <div className="how-professional-content">

            <div>

              <span className="section-label">
                ¿ERES PROFESIONAL?
              </span>

              <h2>
                Convierte tu experiencia
                <br />
                en nuevas oportunidades.
              </h2>

              <p>
                Crea tu perfil, presenta tus servicios
                y conecta con organizaciones que buscan
                profesionales como tú.
              </p>

            </div>


            <Link
              to="/registro"
              className="how-action-button"
            >
              Ofrecer mis servicios →
            </Link>

          </div>

        </div>

      </section>


      {/* ORGANIZACIONES */}

      <section className="how-organization">

        <div className="section-container">

          <div className="how-organization-content">

            <span className="section-label">
              ¿BUSCAS TALENTO?
            </span>

            <h2>
              Encuentra al profesional
              <br />
              que necesitas.
            </h2>

            <p>
              Explora profesionales, revisa sus perfiles
              y envía una solicitud para comenzar a trabajar
              con ellos.
            </p>

            <Link
              to="/marketplace"
              className="how-action-button"
            >
              Buscar profesionales →
            </Link>

          </div>

        </div>

      </section>


      {/* CTA FINAL */}

      <section className="how-final">

        <div className="section-container">

          <span className="section-label">
            SKILLY
          </span>

          <h2>
            El talento está aquí.
          </h2>

          <p>
            Encuentra oportunidades o comienza
            a ofrecer tus servicios.
          </p>

          <div className="how-final-buttons">

            <Link
              to="/marketplace"
              className="how-action-button dark"
            >
              Buscar profesionales
            </Link>

            <Link
              to="/registro"
              className="how-action-button light"
            >
              Ofrecer mis servicios
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

export default ComoFunciona;