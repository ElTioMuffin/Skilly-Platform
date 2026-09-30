import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function ReservarHora() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professional, setProfessional] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = JSON.parse(
    localStorage.getItem("skillyUser") || "null"
  );

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/profesionales/${id}/`
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar el profesional.");
        }

        const data = await response.json();

        setProfessional(data);

        if (data.services && data.services.length > 0) {
          setSelectedService(data.services[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!storedUser) {
      setError("Debes iniciar sesión para reservar una hora.");
      return;
    }

    if (!selectedService) {
      setError("Debes seleccionar un servicio.");
      return;
    }

    if (!date || !time) {
      setError("Selecciona una fecha y una hora.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/reservas/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client: storedUser.id,
            professional: professional.id,
            service: selectedService.id,
            date: date,
            time: time,
            notes: notes,
            status: "Pendiente",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.non_field_errors) {
          throw new Error(data.non_field_errors[0]);
        }

        throw new Error(
          data.detail ||
            data.error ||
            "No se pudo crear la reserva."
        );
      }

      setSuccess("¡Reserva creada correctamente!");

      setTimeout(() => {
        navigate("/mis-reservas");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-container">
          <p>Cargando información...</p>
        </div>
      </main>
    );
  }

  if (error && !professional) {
    return (
      <main className="booking-page">
        <div className="booking-container">
          <Link to="/marketplace" className="back-link">
            ← Volver a profesionales
          </Link>

          <div className="booking-error">
            <h1>No se pudo cargar el profesional</h1>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="booking-container">

        <Link
          to={`/profesional/${professional.id}`}
          className="back-link"
        >
          ← Volver al perfil
        </Link>

        <div className="booking-header">
          <span className="section-label">RESERVAR HORA</span>

          <h1>
            Reserva una hora con {professional.full_name}
          </h1>

          <p>
            Selecciona el servicio, la fecha y el horario que
            prefieras.
          </p>
        </div>

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >

          <div className="booking-field">
            <label>Profesional</label>

            <div className="booking-professional">
              <strong>{professional.full_name}</strong>

              <span>
                {professional.profession || "Profesional"}
              </span>
            </div>
          </div>

          <div className="booking-field">
            <label htmlFor="service">
              Servicio
            </label>

            <select
              id="service"
              value={selectedService?.id || ""}
              onChange={(event) => {
                const service = professional.services.find(
                  (item) =>
                    item.id === Number(event.target.value)
                );

                setSelectedService(service);
              }}
            >
              {professional.services?.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name} — $
                  {Number(service.price).toLocaleString("es-CL")}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-grid">

            <div className="booking-field">
              <label htmlFor="date">
                Fecha
              </label>

              <input
                id="date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="time">
                Hora
              </label>

              <input
                id="time"
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                required
              />
            </div>

          </div>

          <div className="booking-field">
            <label htmlFor="notes">
              Comentarios adicionales
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Escribe algún detalle que quieras comunicar al profesional..."
            />
          </div>

          {error && (
            <div className="booking-message booking-message-error">
              {error}
            </div>
          )}

          {success && (
            <div className="booking-message booking-message-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="booking-submit"
            disabled={saving}
          >
            {saving
              ? "Creando reserva..."
              : "Confirmar reserva"}
          </button>

        </form>
      </div>
    </main>
  );
}

export default ReservarHora;