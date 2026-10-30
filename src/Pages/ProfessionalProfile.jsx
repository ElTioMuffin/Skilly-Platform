import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

function ProfessionalProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedServiceId = searchParams.get("service");
  const navigate = useNavigate();

  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let currentProfile = null;
  try {
    currentProfile = JSON.parse(localStorage.getItem("skillyProfile") || "null");
  } catch {
    currentProfile = null;
  }
  const canBook = currentProfile?.role !== "professional";

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
          "No se pudo cargar el servicio."
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
            ← Volver a servicios
          </Link>

          <h1>
            Cargando servicio...
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
            Servicio no encontrado
          </h1>

          <p>
            {error}
          </p>

          <Link to="/marketplace">
            ← Volver a servicios
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


  const allReviews = Array.isArray(
    professional.reviews
  )
    ? professional.reviews
    : [];


  const mainService =
    services.find((service) => String(service.id) === requestedServiceId)
      || services[0]
      || null;

  const reviews = mainService
    ? allReviews.filter((review) => Number(review.service_id) === Number(mainService.id))
    : [];


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

    navigate(`/reservar/${professional.id}?service=${mainService.id}`);
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
          ← Volver a servicios
        </Link>


        <section className="profile-header">
          <div className="profile-main-info">

            <div className="profile-name">

              <h1>
                {mainService?.name || "Servicio"}
              </h1>

            </div>


            <p className="profile-profession">
              {professional.full_name} · {professional.profession || "Profesional"}
            </p>


            <p className="profile-reviews">
              {reviews.length}{" "}
              {reviews.length === 1
                ? "reseña"
                : "reseñas"}
            </p>


            <div className="profile-tags">

              {mainService?.category && <span>{mainService.category}</span>}

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

          {mainService && (
            <aside className="service-box">
              <span className="section-label">PRECIO DEL SERVICIO</span>
              <strong>${Number(mainService.price).toLocaleString("es-CL")}</strong>
              {canBook && (
                <button type="button" onClick={handleBookAppointment}>
                  Agendar servicio
                </button>
              )}
            </aside>
          )}

        </section>


        <section className="profile-content">

          <div className="profile-description">

            <span className="section-label">
              RELACIÓN PROFESIONAL / SERVICIO
            </span>

            <h2>
              Sobre este servicio
            </h2>

            <p>
              {mainService?.description ||
                "Este servicio está pensado para responder a las necesidades de tu proyecto."}
            </p>

          </div>


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
