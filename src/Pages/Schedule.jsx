import { useEffect, useMemo, useState } from "react";
import "./Schedule.css";

const API_URL = "http://localhost:8000/api/availability/";

const DAYS = [
    { value: "lunes", label: "Lunes", short: "Lun" },
    { value: "martes", label: "Martes", short: "Mar" },
    { value: "miercoles", label: "Miércoles", short: "Mié" },
    { value: "jueves", label: "Jueves", short: "Jue" },
    { value: "viernes", label: "Viernes", short: "Vie" },
    { value: "sabado", label: "Sábado", short: "Sáb" },
    { value: "domingo", label: "Domingo", short: "Dom" },
];

function Schedule() {

    const storedProfile = JSON.parse(
        localStorage.getItem("skillyProfile")
    );

    const professionalId = storedProfile?.id;

    const [availability, setAvailability] = useState([]);

    const [form, setForm] = useState({
        day: "lunes",
        start_time: "09:00",
        end_time: "18:00",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    /*
     * Cargar disponibilidad
     */
    useEffect(() => {
        if (professionalId) {
            loadSchedule();
        }
    }, [professionalId]);


    const loadSchedule = async () => {

        try {

            setLoading(true);
            setError("");

            /*
             * IMPORTANTE:
             * El backend debería devolver solamente
             * los horarios del profesional autenticado.
             *
             * Mientras tu API siga utilizando professional=id,
             * mantenemos este parámetro.
             */
            const response = await fetch(
                `${API_URL}?professional=${professionalId}`
            );

            if (!response.ok) {
                throw new Error("No se pudo cargar la disponibilidad.");
            }

            const data = await response.json();

            setAvailability(data);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }
    };


    /*
     * Agrupar horarios por día
     */
    const schedulesByDay = useMemo(() => {

        const grouped = {};

        DAYS.forEach(day => {
            grouped[day.value] = [];
        });

        availability.forEach(item => {

            if (grouped[item.day]) {
                grouped[item.day].push(item);
            }

        });

        return grouped;

    }, [availability]);


    /*
     * Cantidad de días activos
     */
    const activeDays = useMemo(() => {

        return DAYS.filter(day =>
            schedulesByDay[day.value].some(
                item => item.active !== false
            )
        ).length;

    }, [schedulesByDay]);


    /*
     * Horas disponibles durante la semana
     */
    const totalHours = useMemo(() => {

        return availability
            .filter(item => item.active !== false)
            .reduce((total, item) => {

                const [startHour, startMinute] =
                    item.start_time.split(":").map(Number);

                const [endHour, endMinute] =
                    item.end_time.split(":").map(Number);

                const start =
                    startHour * 60 + startMinute;

                const end =
                    endHour * 60 + endMinute;

                return total + Math.max(0, end - start);

            }, 0);

    }, [availability]);


    /*
     * Convertir minutos a horas
     */
    const formattedHours = useMemo(() => {

        const hours = Math.floor(totalHours / 60);
        const minutes = totalHours % 60;

        if (minutes === 0) {
            return `${hours} h`;
        }

        return `${hours} h ${minutes} min`;

    }, [totalHours]);


    /*
     * Cambios del formulario
     */
    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

    };


    /*
     * Agregar horario
     */
    const addSchedule = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");

        if (!professionalId) {
            setError("No se encontró el perfil profesional.");
            return;
        }

        if (form.start_time >= form.end_time) {
            setError(
                "La hora de término debe ser posterior a la hora de inicio."
            );
            return;
        }

        try {

            setSaving(true);

            const response = await fetch(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        professional: professionalId,
                        day: form.day,
                        start_time: form.start_time,
                        end_time: form.end_time,
                        active: true,
                    }),
                }
            );

            if (!response.ok) {

                const data = await response.json()
                    .catch(() => null);

                throw new Error(
                    data?.detail ||
                    "No se pudo crear el horario."
                );

            }

            await loadSchedule();

            setMessage("Horario agregado correctamente.");

            setForm({
                day: form.day,
                start_time: "09:00",
                end_time: "18:00",
            });

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);

        }
    };


    /*
     * Activar / desactivar horario
     */
    const toggleSchedule = async (item) => {

        try {

            const response = await fetch(
                `${API_URL}${item.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        active: !item.active,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "No se pudo actualizar el horario."
                );
            }

            await loadSchedule();

        } catch (err) {

            setError(err.message);

        }
    };


    /*
     * Eliminar horario
     */
    const deleteSchedule = async (id) => {

        const confirmed = window.confirm(
            "¿Quieres eliminar este horario?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}${id}/`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "No se pudo eliminar el horario."
                );
            }

            await loadSchedule();

            setMessage("Horario eliminado.");

        } catch (err) {

            setError(err.message);

        }
    };


    /*
     * Render
     */
    return (

        <main className="professional-page">

            {/* HERO */}

            <section className="hero-section">

                <div className="hero-content">

                    <span className="hero-label">
                        SKILLY PROFESIONAL
                    </span>

                    <h1>
                        Tu tiempo.
                        <br />
                        Tus reglas.
                    </h1>

                    <p>
                        Configura tu disponibilidad semanal
                        para que tus clientes sepan cuándo
                        pueden solicitar tus servicios.
                    </p>

                </div>

            </section>


            {/* CONTENIDO */}

            <section className="about-section">

                <div className="section-container">

                    <span className="section-label">
                        DISPONIBILIDAD
                    </span>

                    <div className="schedule-header">

                        <div>

                            <h2>
                                Gestiona tus
                                <br />
                                horarios.
                            </h2>

                            <p>
                                Define los momentos en los que
                                estás disponible para trabajar.
                            </p>

                        </div>

                    </div>


                    {/* MENSAJES */}

                    {message && (
                        <div className="schedule-message success">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="schedule-message error">
                            {error}
                        </div>
                    )}


                    {/* ESTADÍSTICAS */}

                    <div className="schedule-stats">

                        <div className="stat-card">

                            <span>
                                DÍAS ACTIVOS
                            </span>

                            <strong>
                                {activeDays}
                            </strong>

                            <small>
                                de 7 días
                            </small>

                        </div>


                        <div className="stat-card">

                            <span>
                                DISPONIBILIDAD
                            </span>

                            <strong>
                                {formattedHours}
                            </strong>

                            <small>
                                por semana
                            </small>

                        </div>


                        <div className="stat-card">

                            <span>
                                BLOQUES
                            </span>

                            <strong>
                                {availability.length}
                            </strong>

                            <small>
                                horarios configurados
                            </small>

                        </div>

                    </div>


                    {/* CALENDARIO */}

                    <div className="weekly-header">

                        <div>

                            <span className="section-label">
                                SEMANA
                            </span>

                            <h3>
                                Tu disponibilidad
                            </h3>

                        </div>

                    </div>


                    {loading ? (

                        <div className="loading-state">
                            Cargando disponibilidad...
                        </div>

                    ) : (

                        <div className="weekly-grid">

                            {DAYS.map(day => {

                                const daySchedules =
                                    schedulesByDay[day.value];

                                return (

                                    <div
                                        className="day-column"
                                        key={day.value}
                                    >

                                        <div className="day-header">

                                            <span>
                                                {day.short}
                                            </span>

                                            <strong>
                                                {day.label}
                                            </strong>

                                        </div>


                                        <div className="day-content">

                                            {daySchedules.length === 0 ? (

                                                <div className="no-schedule">

                                                    <span>
                                                        —
                                                    </span>

                                                    <small>
                                                        Sin disponibilidad
                                                    </small>

                                                </div>

                                            ) : (

                                                daySchedules.map(item => (

                                                    <div
                                                        className={
                                                            `time-card ${
                                                                item.active
                                                                    ? ""
                                                                    : "inactive"
                                                            }`
                                                        }
                                                        key={item.id}
                                                    >

                                                        <div className="time-card-top">

                                                            <span className="status-dot">
                                                            </span>

                                                            <span>
                                                                {item.active
                                                                    ? "Disponible"
                                                                    : "Pausado"
                                                                }
                                                            </span>

                                                        </div>


                                                        <strong className="time-range">

                                                            {item.start_time}

                                                            <span>
                                                                →
                                                            </span>

                                                            {item.end_time}

                                                        </strong>


                                                        <div className="time-actions">

                                                            <button
                                                                type="button"
                                                                className="toggle-button"
                                                                onClick={() =>
                                                                    toggleSchedule(item)
                                                                }
                                                            >
                                                                {item.active
                                                                    ? "Pausar"
                                                                    : "Activar"
                                                                }
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    deleteSchedule(item.id)
                                                                }
                                                            >
                                                                Eliminar
                                                            </button>

                                                        </div>

                                                    </div>

                                                ))

                                            )}

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}


                    {/* AGREGAR HORARIO */}

                    <div className="add-schedule-section">

                        <div className="add-schedule-intro">


                            <h3>
                                Agrega disponibilidad
                            </h3>

                            <p>
                                Puedes crear más de un bloque
                                durante el mismo día.
                            </p>

                        </div>


                        <form
                            className="schedule-form"
                            onSubmit={addSchedule}
                        >

                            <div className="form-group">

                                <label>
                                    Día
                                </label>

                                <select
                                    name="day"
                                    value={form.day}
                                    onChange={handleChange}
                                >

                                    {DAYS.map(day => (

                                        <option
                                            key={day.value}
                                            value={day.value}
                                        >
                                            {day.label}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Desde
                                </label>

                                <input
                                    type="time"
                                    name="start_time"
                                    value={form.start_time}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Hasta
                                </label>

                                <input
                                    type="time"
                                    name="end_time"
                                    value={form.end_time}
                                    onChange={handleChange}
                                />

                            </div>


                            <button
                                type="submit"
                                className="hero-button primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Guardando..."
                                    : "+ Agregar horario"
                                }
                            </button>

                        </form>

                    </div>

                </div>

            </section>

        </main>

    );
}

export default Schedule;