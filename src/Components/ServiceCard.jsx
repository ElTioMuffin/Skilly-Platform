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
      <div className="professional-info">
        <div className="professional-name">
          <h3>{service.name}</h3>
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
              to={`/profesional/${service.professional}?service=${service.id}`}
              className="professional-profile-button"
            >
                Ver servicio
            </Link>
            {canBook && (
              <Link
                to={`/reservar/${service.professional}?service=${service.id}`}
                className="professional-booking-link"
              >
                Agendar servicio
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ServiceCard;
