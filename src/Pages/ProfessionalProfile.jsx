import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfessional = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/profesionales/${id}/`
        );

        console.log(
          "Perfil recibido desde Django:",
          response.data
        );

        setProfessional(response.data);

      } catch (error) {
        console.error(
          "Error al obtener perfil:",
          error
        );

        setError(
          "No se pudo cargar el perfil del profesional."
        );

      } finally {
        setLoading(false);
      }
    };

    loadProfessional();
  }, [id]);


  if (loading) {
    return (
      <main className="profile-page">

        <div className="profile-container">

          <Link
            to="/marketplace"
            className="back-link"
          >
            ← Volver al Marketplace
          </Link>

          <h1>
            Cargando perfil...
          </h1>

          <p>
            Estamos obteniendo la información desde Skilly.
          </p>

        </div>

      </main>
    );
  }


  if (error || !professional) {
    return (
      <main className="profile-page">

        <div className="profile-container">

          <h1>
            Profesional no encontrado
          </h1>

          <p>
            {error}
          </p>

          <Link to="/marketplace">
            ← Volver al Marketplace
          </Link>

        </div>

      </main>
    );
  }


  const services = Array.isArray(
    professional.services
  )
    ? professional.services
    : [];


  const reviews = Array.isArray(
    professional.reviews
  )
    ? professional.reviews
    : [];


  const mainService =
    services.length > 0
      ? services[0]
      : null;


  const handleRequestService = () => {

    if (!mainService) {
      return;
    }

    navigate(
      `/solicitar-servicio/${professional.id}`
    );
  };


  const handleBookAppointment = () => {

    if (!mainService) {
      return;
    }

    navigate(
      `/reservar/${professional.id}`
    );
  };


  const handleViewRequests = () => {

    navigate(
      `/solicitudes/${professional.id}`
    );
  };


  return (
    <main className="profile-page">

      <div className="profile-container">

        <Link
          to="/marketplace"
          className="back-link"
        >
          ← Volver al Marketplace
        </Link>


        {/* PERFIL DEL PROFESIONAL */}

        <section className="profile-header">

          <div className="profile-photo">

            <span>
              {professional.full_name
                ?.charAt(0)
                .toUpperCase()}
            </span>

          </div>


          <div className="profile-main-info">

            <div className="profile-name">

              <h1>
                {professional.full_name}
              </h1>

              {professional.validated && (
                <span className="validated-badge">
                  ✓
                </span>
              )}

            </div>


            <p className="profile-profession">
              {professional.profession ||
                "Profesional"}
            </p>


            <p className="profile-reviews">
              {reviews.length}{" "}
              {reviews.length === 1
                ? "reseña"
                : "reseñas"}
            </p>


            <div className="profile-tags">

              {mainService && (
                <span>
                  {mainService.name}
                </span>
              )}

              {mainService && (
                <span>
                  {mainService.modality}
                </span>
              )}

              {professional.location && (
                <span>
                  {professional.location}
                </span>
              )}

            </div>

          </div>

        </section>


        {/* INFORMACIÓN DEL PROFESIONAL */}

        <section className="profile-content">

          <div className="profile-description">

            <span className="section-label">
              PERFIL PROFESIONAL
            </span>

            <h2>
              Sobre este profesional
            </h2>

            <p>
              {professional.bio ||
                `Profesional especializado en ${
                  professional.profession ||
                  "su área"
                }. Con experiencia orientada a
                entregar soluciones adaptadas a
                las necesidades de cada proyecto.`}
            </p>

          </div>


          <aside className="service-box">

            <span className="section-label">
              SERVICIO
            </span>


            {mainService ? (

              <>

                <h3>
                  {mainService.name}
                </h3>


                {mainService.description && (
                  <p>
                    {mainService.description}
                  </p>
                )}


                <p>
                  Desde
                </p>


                <strong>
                  $
                  {Number(
                    mainService.price
                  ).toLocaleString("es-CL")}
                </strong>


                <div className="profile-action-buttons">

                  {/* <button
                    type="button"
                    className="request-service-button"
                    onClick={handleRequestService}
                  >
                    Solicitar servicio
                  </button> */}


                  <button
                    type="button"
                    className="profile-book-button"
                    onClick={handleBookAppointment}
                  >
                    Reservar hora
                  </button>

                </div>

              </>

            ) : (

              <p>
                Este profesional todavía no tiene
                servicios publicados.
              </p>

            )}

            
            {/* <button
              type="button"
              className="view-requests-button"
              onClick={handleViewRequests}
            >
              Ver solicitudes recibidas
            </button> */}

          </aside>

        </section>


        {/* RESEÑAS */}

        <section className="reviews-section">

          <span className="section-label">
            EXPERIENCIAS DE CLIENTES
          </span>

          <h2>
            Reseñas
          </h2>


          {reviews.length > 0 ? (

            reviews.map((review) => (

              <div
                className="review-card"
                key={review.id}
              >

                <p>
                  "{review.comment}"
                </p>


                <div className="review-meta">

                  <span>
                    Cliente {review.client_full_name || review.client_username}
                  </span>

                  <span>
                    {review.created_at
                      ? new Date(
                          review.created_at
                        ).toLocaleDateString(
                          "es-CL"
                        )
                      : ""}
                  </span>

                </div>

              </div>

            ))

          ) : (

            <div className="no-reviews">

              <p>
                Este profesional todavía no tiene
                reseñas.
              </p>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}

export default ProfessionalProfile;