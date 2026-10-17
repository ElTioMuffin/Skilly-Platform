import { Link } from "react-router-dom";

function ServiceCard({ service }) {
  if (!service) {
    return null;
  }

  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem("skillyProfile") || "null");
  } catch {
    profile = null;
  }
  const canBook = profile?.role !== "professional";

  return (
    <article className="professional-card">
      <div className="professional-photo">
        <span>
          {service.name?.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="professional-info">
        <div className="professional-name">
          <h3>{service.name}</h3>
          {service.professional_validated && (
            <span className="validated-badge">✓</span>
          )}
        </div>

        <p className="professional-profession">
          Por {service.professional_name} · {service.professional_profession || "Profesional"}
        </p>

        <div className="reviews-count">
          {service.professional_review_count || 0} reseñas del profesional
        </div>

        <div className="professional-service">
          {service.category} · {service.modality}
        </div>

        <div className="professional-footer">
          <span>
            ${Number(service.price).toLocaleString("es-CL")}
          </span>

          <div className="professional-card-actions">
            <Link
              to={`/profesional/${service.professional}`}
              className="professional-profile-button"
            >
              Ver perfil
            </Link>
            {canBook && (
              <Link
                to={`/reservar/${service.professional}?service=${service.id}`}
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

export default ServiceCard;
