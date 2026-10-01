import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

function ProfessionalBookings() {
  const [searchParams] = useSearchParams();
  const highlightedReservationId = searchParams.get("reserva");
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const storedUser = JSON.parse(
    localStorage.getItem("skillyUser") || "null"
  );

  const storedProfile = JSON.parse(
    localStorage.getItem("skillyProfile") || "null"
  );

  const professionalId = storedProfile?.id;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!storedUser || !professionalId) {
          setError(
            "No se encontró la información del profesional."
          );
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

        const reservasProfesional =
          reservasResponse.data.filter(
            (reserva) =>
              Number(reserva.professional) ===
              Number(professionalId)
          );

        setReservas(reservasProfesional);

        /*
          Por ahora obtenemos los usuarios desde las reservas.
          El backend actualmente entrega el ID del cliente.
        */
        const idsClientes = [
          ...new Set(
            reservasProfesional.map(
              (reserva) => reserva.client
            )
          ),
        ];

        setClientes(idsClientes);

      } catch (error) {
        console.error(
          "Error al cargar reservas recibidas:",
          error
        );

        setError(
          "No se pudieron cargar las reservas recibidas."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [professionalId]);

  useEffect(() => {
    if (!highlightedReservationId || !reservas.length) return;
    document.getElementById(`reservation-${highlightedReservationId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedReservationId, reservas]);

  const updateReservationStatus = async (
    reservationId,
    newStatus
  ) => {
    setUpdatingId(reservationId);
    setError("");

    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/reservas/${reservationId}/`,
        {
          status: newStatus,
        }
      );

      setReservas((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === reservationId
            ? {
                ...reservation,
                status: response.data.status,
              }
            : reservation
        )
      );
    } catch (error) {
      console.error(
        "Error al actualizar reserva:",
        error
      );

      setError(
        "No se pudo actualizar el estado de la reserva."
      );
    } finally {
      setUpdatingId(null);
    }
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
      <main className="professional-bookings-page">
        <div className="professional-bookings-container">
          <p>Cargando reservas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="professional-bookings-page">

      <div className="professional-bookings-container">

        <Link
          to="/marketplace"
          className="back-link"
        >
          ← Volver al Marketplace
        </Link>

        <header className="professional-bookings-header">

          <span className="section-label">
            GESTIÓN PROFESIONAL
          </span>

          <h1>
            Reservas recibidas
          </h1>

          <p>
            Aquí puedes revisar y gestionar las
            reservas realizadas por tus clientes.
          </p>

        </header>

        {error && (
          <div className="professional-bookings-error">
            {error}
          </div>
        )}

        {!error && reservas.length === 0 && (
          <div className="no-professional-bookings">

            <h2>
              No tienes reservas todavía
            </h2>

            <p>
              Cuando un cliente reserve una hora
              contigo, aparecerá aquí.
            </p>

          </div>
        )}

        {reservas.length > 0 && (
          <div className="professional-bookings-list">

            {reservas.map((reserva) => (

              <article
                className={`professional-booking-card${String(reserva.id) === highlightedReservationId ? " request-card-highlighted" : ""}`}
                key={reserva.id}
                id={`reservation-${reserva.id}`}
              >

                <div className="professional-booking-header">

                  <div>

                    <span className="booking-card-label">
                      RESERVA #{reserva.id}
                    </span>

                    <h2>
                      Cliente #{reserva.client}
                    </h2>

                  </div>

                  <span
                    className={`booking-status booking-status-${reserva.status?.toLowerCase()}`}
                  >
                    {reserva.status}
                  </span>

                </div>


                <div className="professional-booking-information">

                  <div className="booking-data">

                    <span>
                      Servicio
                    </span>

                    <strong>
                      Reserva de servicio
                    </strong>

                  </div>


                  <div className="booking-data">

                    <span>
                      Fecha
                    </span>

                    <strong>
                      {formatDate(reserva.date)}
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
                  <div className="professional-booking-notes">

                    <span>
                      Comentarios del cliente
                    </span>

                    <p>
                      {reserva.notes}
                    </p>

                  </div>
                )}


                {reserva.status === "Pendiente" && (

                  <div className="professional-booking-actions">

                    <button
                      type="button"
                      className="confirm-booking-button"
                      disabled={
                        updatingId === reserva.id
                      }
                      onClick={() =>
                        updateReservationStatus(
                          reserva.id,
                          "Confirmada"
                        )
                      }
                    >
                      {updatingId === reserva.id
                        ? "Actualizando..."
                        : "✓ Confirmar reserva"}
                    </button>


                    <button
                      type="button"
                      className="cancel-booking-button"
                      disabled={
                        updatingId === reserva.id
                      }
                      onClick={() =>
                        updateReservationStatus(
                          reserva.id,
                          "Cancelada"
                        )
                      }
                    >
                      Cancelar reserva
                    </button>

                  </div>

                )}


                {reserva.status === "Confirmada" && (

                  <div className="professional-booking-actions">

                    <button
                      type="button"
                      className="complete-booking-button"
                      disabled={
                        updatingId === reserva.id
                      }
                      onClick={() =>
                        updateReservationStatus(
                          reserva.id,
                          "Completada"
                        )
                      }
                    >
                      {updatingId === reserva.id
                        ? "Actualizando..."
                        : "✓ Marcar como completada"}
                    </button>

                  </div>

                )}


                {reserva.status === "Cancelada" && (

                  <div className="booking-final-message">
                    Esta reserva fue cancelada.
                  </div>

                )}


                {reserva.status === "Completada" && (

                  <div className="booking-final-message">
                    ✓ Esta reserva fue completada.
                  </div>

                )}

              </article>

            ))}

          </div>
        )}

      </div>

    </main>
  );
}

export default ProfessionalBookings;
