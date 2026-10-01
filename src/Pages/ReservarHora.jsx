import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function ReservarHora() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professional, setProfessional] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

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

  const activeDays = useMemo(() => new Set(
    availability.filter((item) => item.active === true).map((item) => item.day)
  ), [availability]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const firstSelectableDate = new Date();
  firstSelectableDate.setHours(0, 0, 0, 0);
  const selectedDateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("es-CL", {
      weekday: "long", day: "numeric", month: "long",
    })
    : "Selecciona un día";

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

  useEffect(() => {
    if (!professional?.id) return;

    let cancelled = false;
    fetch(`http://127.0.0.1:8000/api/availability/?professional=${professional.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar la disponibilidad.");
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results || [];
        if (!cancelled) setAvailability(items);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });

    return () => { cancelled = true; };
  }, [professional?.id]);

  useEffect(() => {
    if (!date || !professional?.id) {
      setAvailableTimes([]);
      setTime("");
      return;
    }

    let cancelled = false;
    const loadTimes = async () => {
      setLoadingTimes(true);
      setError("");
      setTime("");
      try {
        const appointmentsResponse = await fetch("http://127.0.0.1:8000/api/reservas/");
        if (!appointmentsResponse.ok) {
          throw new Error("No se pudieron cargar los horarios disponibles.");
        }
        const appointmentsData = await appointmentsResponse.json();
        const appointments = Array.isArray(appointmentsData)
          ? appointmentsData
          : appointmentsData.results || [];
        const weekday = new Date(`${date}T00:00:00`).getDay();
        const day = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][weekday];
        const blocks = availability.filter((item) =>
          Number(item.professional) === Number(professional.id)
          && item.day === day
          && item.active === true
        );
        const booked = new Set(appointments
          .filter((item) => Number(item.professional) === Number(professional.id)
            && item.date === date && ["Pendiente", "Confirmada"].includes(item.status))
          .map((item) => item.time?.slice(0, 5)));
        const slots = new Set();
        blocks.forEach(({ start_time, end_time }) => {
          const [sh, sm] = start_time.split(":").map(Number);
          const [eh, em] = end_time.split(":").map(Number);
          for (let minute = sh * 60 + sm; minute < eh * 60 + em; minute += 30) {
            const slot = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
            if (!booked.has(slot)) slots.add(slot);
          }
        });
        if (!cancelled) setAvailableTimes([...slots].sort());
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingTimes(false);
      }
    };
    loadTimes();
    return () => { cancelled = true; };
  }, [date, professional?.id, availability]);

  const selectCalendarDate = (dayNumber) => {
    const year = visibleMonth.getFullYear();
    const month = String(visibleMonth.getMonth() + 1).padStart(2, "0");
    const day = String(dayNumber).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
  };

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

        if (data.time) {
          throw new Error(Array.isArray(data.time) ? data.time[0] : data.time);
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

          <section className="booking-calendar" aria-label="Calendario de disponibilidad">
            <div className="booking-calendar-header">
              <div>
                <label>Fecha</label>
                <h2>
                  {visibleMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                </h2>
              </div>
              <div className="booking-calendar-navigation">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  disabled={visibleMonth.getFullYear() === firstSelectableDate.getFullYear()
                    && visibleMonth.getMonth() === firstSelectableDate.getMonth()}
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                >‹</button>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                >›</button>
              </div>
            </div>

            <div className="booking-calendar-grid booking-calendar-weekdays">
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="booking-calendar-grid">
              {calendarDays.map((dayNumber, index) => {
                if (!dayNumber) return <span className="booking-calendar-empty" key={`empty-${index}`} />;
                const year = visibleMonth.getFullYear();
                const month = visibleMonth.getMonth();
                const current = new Date(year, month, dayNumber);
                const dayKey = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"][current.getDay()];
                const currentIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
                const hasHours = availability.some((item) => item.day === dayKey && item.active === true);
                const isPast = current < firstSelectableDate;
                const isSelected = currentIso === date;
                return (
                  <button
                    type="button"
                    key={currentIso}
                    className={`booking-calendar-day${hasHours ? " has-hours" : ""}${isSelected ? " selected" : ""}`}
                    disabled={isPast || !hasHours}
                    aria-pressed={isSelected}
                    onClick={() => selectCalendarDate(dayNumber)}
                  >
                    {dayNumber}
                    {hasHours && <span aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <p className="booking-calendar-legend">
              <span /> Días con disponibilidad
            </p>

            <div className="booking-time-picker">
              <div className="booking-time-picker-heading">
                <h3>{date ? selectedDateLabel : "Horas disponibles"}</h3>
                {date && <span>{availableTimes.length} horarios</span>}
              </div>
              {!date ? (
                <p>Elige un día marcado en el calendario para ver las horas.</p>
              ) : loadingTimes ? (
                <p>Cargando horas disponibles…</p>
              ) : availableTimes.length > 0 ? (
                <div className="booking-time-options" role="group" aria-label="Horas disponibles">
                  {availableTimes.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      className={`booking-time-option${time === slot ? " selected" : ""}`}
                      aria-pressed={time === slot}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p>No quedan horas libres para este día. Elige otra fecha.</p>
              )}
            </div>
          </section>

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
