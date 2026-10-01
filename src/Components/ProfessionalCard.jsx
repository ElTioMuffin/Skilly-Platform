import { Link } from "react-router-dom";

function ProfessionalCard({ professional }) {
  if (!professional) {
    return null;
  }

  const services = Array.isArray(professional.services)
    ? professional.services
    : [];

  const mainService = services.length > 0
    ? services[0]
    : null;

  return (
    <article className="professional-card">

      <div className="professional-photo">
        <span>
          {professional.full_name?.charAt(0).toUpperCase()}
        </span>
      </div>


      <div className="professional-info">

        <div className="professional-name">

          <h3>
            {professional.full_name}
          </h3>

          {professional.validated && (
            <span className="validated-badge">
              ✓
            </span>
          )}

        </div>


        <p className="professional-profession">
          {professional.profession || "Profesional"}
        </p>

          
        <div className="reviews-count">
          {professional.reviews?.length || 0} reseñas
        </div>


        {mainService && (

          <div className="professional-service">

            {mainService.name}

          </div>

        )}


        <div className="professional-footer">

          <span>

            {mainService
              ? `Desde $${Number(mainService.price).toLocaleString("es-CL")}`
              : "Consultar precio"}

          </span>


          <div className="professional-card-actions">
            <Link
              to={`/profesional/${professional.id}`}
              className="professional-profile-button"
            >
              Ver perfil
            </Link>
            {mainService && (
              <Link
                to={`/reservar/${professional.id}`}
                className="professional-booking-link"
              >
                Reservar hora
              </Link>
            )}
          </div>

        </div>

      </div>

    </article>
  );
}

export default ProfessionalCard;
