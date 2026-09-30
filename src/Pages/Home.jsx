import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home">

      {/* HERO */}
      <section className="hero-section">

        <div className="hero-content">

          <span className="hero-label">
            SKILLY LATAM
          </span>

          <h1>
            Conecta con el talento
            <br />
            que necesitas.
          </h1>

          <p>
            Encuentra profesionales expertos y contrata
            servicios de manera simple, segura y flexible.
          </p>

          <div className="hero-buttons">

            <Link
              to="/marketplace"
              className="hero-button primary"
            >
              Buscar talento
            </Link>

            <Link
              to="/registro"
              className="hero-button secondary"
            >
              Ofrecer mis servicios
            </Link>

          </div>

        </div>

      </section>


      {/* QUÉ ES SKILLY */}
      <section className="about-section">

        <div className="section-container">

          <span className="section-label">
            ¿QUÉ ES SKILLY?
          </span>

          <h2>
            Un espacio para conectar
            <br />
            talento y organizaciones.
          </h2>

          <p>
            Skilly conecta talento experto independiente
            con organizaciones que necesitan capacidades
            especializadas de manera ágil y flexible.
          </p>

        </div>

      </section>


      {/* CÓMO FUNCIONA */}
      <section className="how-section">

        <div className="section-container">

          <span className="section-label">
            ¿CÓMO FUNCIONA?
          </span>

          <h2>
            Del talento a la oportunidad
          </h2>

          <div className="steps-grid">

            <div className="step-card">

              <span>
                01
              </span>

              <h3>
                Busca
              </h3>

              <p>
                Encuentra profesionales y servicios
                según tus necesidades.
              </p>

            </div>


            <div className="step-card">

              <span>
                02
              </span>

              <h3>
                Compara
              </h3>

              <p>
                Revisa perfiles, experiencia y
                reputación.
              </p>

            </div>


            <div className="step-card">

              <span>
                03
              </span>

              <h3>
                Agenda
              </h3>

              <p>
                Selecciona disponibilidad y
                horario.
              </p>

            </div>


            <div className="step-card">

              <span>
                04
              </span>

              <h3>
                Contrata
              </h3>

              <p>
                Confirma el servicio y comienza
                el proceso.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* DOS USUARIOS */}
      <section className="users-section">

        <div className="section-container">

          <span className="section-label">
            ENCUENTRA TU CAMINO
          </span>

          <div className="users-grid">

            <div className="user-card organization-card">

              <span className="user-number">
                01
              </span>

              <h2>
                Soy una organización
              </h2>

              <p>
                Encuentra talento experto validado
                para tus proyectos y necesidades.
              </p>

              <Link
                to="/marketplace"
                className="user-card-button"
              >
                Buscar talento →
              </Link>

            </div>


            <div className="user-card professional-card">

              <span className="user-number">
                02
              </span>

              <h2>
                Soy profesional
              </h2>

              <p>
                Crea tu perfil, publica tus servicios
                y encuentra nuevas oportunidades.
              </p>

              <Link
                to="/registro"
                className="user-card-button"
              >
                Ofrecer mis servicios →
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="cta-section">

        <div className="cta-content">

          <h2>
            El talento que necesitas.
            <br />
            Las oportunidades que buscas.
          </h2>

          <p>
            Forma parte del ecosistema Skilly.
          </p>

          <Link
            to="/registro"
            className="cta-button"
          >
            Comenzar ahora
          </Link>

        </div>

      </section>

    </main>
  );
}

export default Home;