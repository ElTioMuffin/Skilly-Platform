import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedUser = JSON.parse(
    localStorage.getItem("skillyUser") || "null"
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!storedUser) {
          setError("Debes iniciar sesión para ver tus reservas.");
          setLoading(false);
          return;
        }

        const [reservasResponse, profesionalesResponse] =
          await Promise.all([
            axios.get(
              "http://127.0.0.1:8000/api/reservas/"
            ),
            axios.get(
              "http://127.0.0.1:8000/api/profesionales/"
            ),
          ]);

        const reservasCliente =
          reservasResponse.data.filter(
            (reserva) =>
              Number(reserva.client) === Number(storedUser.id)
          );

        setReservas(reservasCliente);
        setProfesionales(profesionalesResponse.data);

      } catch (error) {
        console.error(
          "Error al cargar reservas:",
          error
        );

        setError(
          "No se pudieron cargar tus reservas."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storedUser?.id]);

  const getProfessional = (professionalId) => {
    return profesionales.find(
      (professional) =>
        Number(professional.id) === Number(professionalId)
    );
  };

  const getServiceName = (
    professionalId,
    serviceId
  ) => {
    const professional =
      getProfessional(professionalId);

    if (!professional) {
      return "Servicio";
    }

    const service = professional.services?.find(
      (item) =>
        Number(item.id) === Number(serviceId)
    );

    return service
      ? service.name
      : "Servicio";
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  if (loading) {
    return (
      <main className="client-bookings-page">
        <div className="client-bookings-container">
          <p>Cargando tus reservas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="client-bookings-page">

      <div className="client-bookings-container">

        <Link
          to="/marketplace"
          className="back-link"
        >
          ← Volver a profesionales
        </Link>

        <header className="client-bookings-header">

          <span className="section-label">
            MIS RESERVAS
          </span>

          <h1>
            Mis reservas
          </h1>

          <p>
            Aquí puedes revisar las horas que has
            reservado con profesionales de Skilly.
          </p>

        </header>

        {error && (
          <div className="booking-list-error">
            {error}
          </div>
        )}

        {!error && reservas.length === 0 && (
          <div className="no-bookings">

            <h2>
              Todavía no tienes reservas
            </h2>

            <p>
              Explora nuestros profesionales y
              reserva una hora cuando encuentres
              el servicio que necesitas.
            </p>

            <Link
              to="/marketplace"
              className="new-booking-button"
            >
              Buscar profesionales
            </Link>

          </div>
        )}

        {reservas.length > 0 && (
          <div className="bookings-list">

            {reservas.map((reserva) => {

              const professional =
                getProfessional(
                  reserva.professional
                );

              return (
                <article
                  className="booking-card"
                  key={reserva.id}
                >

                  <div className="booking-card-header">

                    <div>
                      <span className="booking-card-label">
                        RESERVA
                      </span>

                      <h2>
                        {professional
                          ? professional.full_name
                          : "Profesional"}
                      </h2>

                      <p>
                        {professional?.profession ||
                          "Profesional"}
                      </p>
                    </div>

                    <span
                      className={`booking-status booking-status-${reserva.status?.toLowerCase()}`}
                    >
                      {reserva.status}
                    </span>

                  </div>

                  <div className="booking-card-content">

                    <div className="booking-data">

                      <span>
                        Servicio
                      </span>

                      <strong>
                        {getServiceName(
                          reserva.professional,
                          reserva.service
                        )}
                      </strong>

                    </div>

                    <div className="booking-data">

                      <span>
                        Fecha
                      </span>

                      <strong>
                        {formatDate(
                          reserva.date
                        )}
                      </strong>

                    </div>

                    <div className="booking-data">

                      <span>
                        Hora
                      </span>

                      <strong>
                        {reserva.time?.slice(0, 5)}
                      </strong>

                    </div>

                  </div>

                  {reserva.notes && (
                    <div className="booking-notes">

                      <span>
                        Comentarios
                      </span>

                      <p>
                        {reserva.notes}
                      </p>

                    </div>
                  )}

                  {professional && (
                    <Link
                      to={`/profesional/${professional.id}`}
                      className="booking-profile-button"
                    >
                      Ver perfil del profesional
                    </Link>
                  )}

                  {reserva.status == "Completada" && (
                    <Link
                      to={`/dejar-review/${reserva.id}`}
                      className="booking-profile-button"
                    >
                      {console.log(reserva)}
                      Dejar review
                    </Link>
                  )}
                </article>
              );
            })}

          </div>
        )}

      </div>

    </main>
  );
}

export default MisReservas;