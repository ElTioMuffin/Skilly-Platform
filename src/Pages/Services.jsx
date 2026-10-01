import { useEffect, useMemo, useState } from "react";
import "./Services.css";

const API_URL = "http://localhost:8000/api/services/";

const CATEGORIES = [
    {
        value: "Diseño",
        label: "Diseño",
    },
    {
        value: "Desarrollo",
        label: "Desarrollo",
    },
    {
        value: "Marketing",
        label: "Marketing",
    },
    {
        value: "Otro",
        label: "Otro",
    },
];

const MODALITIES = [
    {
        value: "Remoto",
        label: "Remoto",
    },
    {
        value: "Híbrido",
        label: "Híbrido",
    },
    {
        value: "Presencial",
        label: "Presencial",
    },
];

function Services() {

    // =========================================================
    // PERFIL PROFESIONAL
    // =========================================================

    const storedProfile = JSON.parse(
        localStorage.getItem("skillyProfile")
    );

    const professionalId = storedProfile?.id;


    // =========================================================
    // ESTADOS
    // =========================================================

    const [services, setServices] = useState([]);

    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "Diseño",
        modality: "Remoto",
        location: "",
        price: "",
        active: true,
    });

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");


    // =========================================================
    // CARGAR SERVICIOS
    // =========================================================

    useEffect(() => {

        if (professionalId) {
            loadServices();
        } else {
            setLoading(false);
            setError(
                "No se encontró el perfil profesional."
            );
        }

    }, [professionalId]);


    const loadServices = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}?professional=${professionalId}`
            );

            if (!response.ok) {

                throw new Error(
                    "No se pudieron cargar los servicios."
                );

            }

            const data = await response.json();

            setServices(data);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // ESTADÍSTICAS
    // =========================================================

    const activeServices = useMemo(() => {

        return services.filter(
            service => service.active
        ).length;

    }, [services]);


    const averagePrice = useMemo(() => {

        const active = services.filter(
            service => service.active
        );

        if (active.length === 0) {
            return 0;
        }

        const total = active.reduce(
            (sum, service) => {

                return (
                    sum +
                    Number(service.price || 0)
                );

            },
            0
        );

        return Math.round(
            total / active.length
        );

    }, [services]);


    // =========================================================
    // FORMULARIO
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setForm({
            ...form,
            [name]: value,
        });

    };


    const formatPrice = (price) => {

        return new Intl.NumberFormat(
            "es-CL"
        ).format(
            Number(price || 0)
        );

    };


    const resetForm = () => {

        setForm({
            name: "",
            description: "",
            category: "Diseño",
            modality: "Remoto",
            location: "",
            price: "",
            active: true,
        });

        setEditingId(null);

        setError("");

    };


    // =========================================================
    // CREAR / EDITAR SERVICIO
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");


        // -----------------------------------------------------
        // Validaciones
        // -----------------------------------------------------

        if (!professionalId) {

            setError(
                "No se encontró el perfil profesional."
            );

            return;

        }


        if (!form.name.trim()) {

            setError(
                "Debes ingresar un nombre para el servicio."
            );

            return;

        }


        if (!form.description.trim()) {

            setError(
                "Debes ingresar una descripción."
            );

            return;

        }


        if (
            form.price === "" ||
            Number(form.price) < 0
        ) {

            setError(
                "Ingresa un precio válido."
            );

            return;

        }


        try {

            setSaving(true);


            // -------------------------------------------------
            // Datos enviados al backend
            // -------------------------------------------------

            const payload = {

                professional: professionalId,

                name: form.name.trim(),

                description:
                    form.description.trim(),

                category:
                    form.category,

                modality:
                    form.modality,

                location:
                    form.location.trim(),

                price:
                    Number(form.price),

                active:
                    form.active,

            };


            // -------------------------------------------------
            // Crear o editar
            // -------------------------------------------------

            const url = editingId
                ? `${API_URL}${editingId}/`
                : API_URL;

            const method = editingId
                ? "PATCH"
                : "POST";


            const response = await fetch(
                url,
                {
                    method,

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify(payload),
                }
            );


            if (!response.ok) {

                const data =
                    await response
                        .json()
                        .catch(() => null);


                // Intentar mostrar errores DRF
                if (data) {

                    if (
                        typeof data === "object"
                    ) {

                        const firstError =
                            Object.values(data)
                                .flat()
                                .find(
                                    value =>
                                        typeof value ===
                                        "string"
                                );

                        if (firstError) {
                            throw new Error(
                                firstError
                            );
                        }

                    }

                }


                throw new Error(
                    editingId
                        ? "No se pudo actualizar el servicio."
                        : "No se pudo crear el servicio."
                );

            }


            // -------------------------------------------------
            // Actualizar lista
            // -------------------------------------------------

            await loadServices();


            setMessage(
                editingId
                    ? "Servicio actualizado correctamente."
                    : "Servicio creado correctamente."
            );


            resetForm();


            // -------------------------------------------------
            // Volver arriba
            // -------------------------------------------------

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });


        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);

        }

    };


    // =========================================================
    // EDITAR SERVICIO
    // =========================================================

    const editService = (service) => {

        setEditingId(service.id);

        setForm({

            name:
                service.name || "",

            description:
                service.description || "",

            category:
                service.category || "Diseño",

            modality:
                service.modality || "Remoto",

            location:
                service.location || "",

            price:
                service.price || "",

            active:
                service.active ?? true,

        });


        setError("");

        setMessage("");


        window.scrollTo({
            top:
                document.body.scrollHeight,
            behavior: "smooth",
        });

    };


    // =========================================================
    // ACTIVAR / DESACTIVAR
    // =========================================================

    const toggleService = async (
        service
    ) => {

        try {

            setError("");
            setMessage("");


            const response = await fetch(
                `${API_URL}${service.id}/`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        active:
                            !service.active,
                    }),
                }
            );


            if (!response.ok) {

                throw new Error(
                    "No se pudo actualizar el servicio."
                );

            }


            await loadServices();


            setMessage(
                service.active
                    ? "Servicio desactivado."
                    : "Servicio activado."
            );


        } catch (err) {

            setError(err.message);

        }

    };


    // =========================================================
    // ELIMINAR SERVICIO
    // =========================================================

    const deleteService = async (
        id
    ) => {

        const confirmed =
            window.confirm(
                "¿Quieres eliminar este servicio?\n\nEsta acción no se puede deshacer."
            );


        if (!confirmed) {
            return;
        }


        try {

            setError("");
            setMessage("");


            const response = await fetch(
                `${API_URL}${id}/`,
                {
                    method: "DELETE",
                }
            );


            if (!response.ok) {

                throw new Error(
                    "No se pudo eliminar el servicio."
                );

            }


            // Si estábamos editando este servicio
            if (editingId === id) {
                resetForm();
            }


            await loadServices();


            setMessage(
                "Servicio eliminado correctamente."
            );


        } catch (err) {

            setError(err.message);

        }

    };


    // =========================================================
    // SCROLL AL FORMULARIO
    // =========================================================

    const openCreateForm = () => {

        resetForm();

        setTimeout(() => {

            window.scrollTo({
                top:
                    document.body.scrollHeight,
                behavior: "smooth",
            });

        }, 50);

    };


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <main className="professional-page">


            {/* =================================================
                HERO
            ================================================= */}

            <section className="hero-section">

                <div className="hero-content">

                    <span className="hero-label">
                        SKILLY PROFESIONAL
                    </span>


                    <h1>
                        Convierte
                        <br />
                        tus habilidades.
                    </h1>


                    <p>
                        Crea servicios claros para que
                        tus clientes conozcan lo que haces,
                        cuánto cuesta y cómo pueden
                        contratarte.
                    </p>

                </div>

            </section>



            {/* =================================================
                SERVICIOS
            ================================================= */}

            <section className="services-section">

                <div className="section-container">


                    {/* -------------------------------------------------
                        HEADER
                    ------------------------------------------------- */}

                    <span className="section-label">
                        MIS SERVICIOS
                    </span>


                    <div className="services-header">

                        <div>

                            <h2>
                                Lo que
                                <br />
                                ofreces.
                            </h2>

                            <p>
                                Administra tus servicios
                                profesionales desde un solo lugar.
                            </p>

                        </div>


                        <button
                            className="create-service-button"
                            onClick={
                                openCreateForm
                            }
                        >
                            + Crear servicio
                        </button>

                    </div>



                    {/* -------------------------------------------------
                        MENSAJES
                    ------------------------------------------------- */}

                    {message && (

                        <div className="service-message success">

                            {message}

                        </div>

                    )}


                    {error && (

                        <div className="service-message error">

                            {error}

                        </div>

                    )}



                    {/* -------------------------------------------------
                        ESTADÍSTICAS
                    ------------------------------------------------- */}

                    <div className="service-stats">


                        <div className="service-stat">

                            <span>
                                SERVICIOS
                            </span>

                            <strong>
                                {services.length}
                            </strong>

                            <small>
                                creados
                            </small>

                        </div>


                        <div className="service-stat">

                            <span>
                                ACTIVOS
                            </span>

                            <strong>
                                {activeServices}
                            </strong>

                            <small>
                                publicados
                            </small>

                        </div>


                        <div className="service-stat">

                            <span>
                                PRECIO MEDIO
                            </span>

                            <strong>
                                $
                                {formatPrice(
                                    averagePrice
                                )}
                            </strong>

                            <small>
                                servicios activos
                            </small>

                        </div>


                    </div>



                    {/* -------------------------------------------------
                        CATÁLOGO
                    ------------------------------------------------- */}

                    <div className="services-list-header">

                        <div>

                            <span className="section-label">
                                CATÁLOGO
                            </span>

                            <h3>
                                Tus servicios
                            </h3>

                        </div>

                    </div>



                    {/* -------------------------------------------------
                        LOADING
                    ------------------------------------------------- */}

                    {loading && (

                        <div className="services-loading">

                            Cargando servicios...

                        </div>

                    )}



                    {/* -------------------------------------------------
                        SIN SERVICIOS
                    ------------------------------------------------- */}

                    {!loading &&
                        services.length === 0 && (

                            <div className="services-empty">

                                <span>
                                    01
                                </span>

                                <h3>
                                    Todavía no tienes
                                    servicios.
                                </h3>

                                <p>
                                    Crea tu primer servicio
                                    para comenzar a ofrecer
                                    tus habilidades dentro
                                    de Skilly.
                                </p>

                                <button
                                    className="hero-button primary"
                                    onClick={
                                        openCreateForm
                                    }
                                >
                                    Crear mi primer
                                    servicio
                                </button>

                            </div>

                        )}



                    {/* -------------------------------------------------
                        LISTA DE SERVICIOS
                    ------------------------------------------------- */}

                    {!loading &&
                        services.length > 0 && (

                            <div className="services-grid">

                                {services.map(
                                    service => (

                                        <article
                                            className={
                                                `service-card ${
                                                    service.active
                                                        ? ""
                                                        : "service-inactive"
                                                }`
                                            }
                                            key={
                                                service.id
                                            }
                                        >


                                            {/* CARD HEADER */}

                                            <div className="service-card-top">

                                                <span className="service-category">
                                                    {
                                                        service.category
                                                    }
                                                </span>


                                                <span
                                                    className={
                                                        `service-status ${
                                                            service.active
                                                                ? "active"
                                                                : "inactive"
                                                        }`
                                                    }
                                                >

                                                    <span />

                                                    {service.active
                                                        ? "Activo"
                                                        : "Pausado"}

                                                </span>

                                            </div>



                                            {/* NAME */}

                                            <h3>
                                                {
                                                    service.name
                                                }
                                            </h3>



                                            {/* DESCRIPTION */}

                                            <p className="service-description">

                                                {
                                                    service.description
                                                }

                                            </p>



                                            {/* DETAILS */}

                                            <div className="service-details">


                                                <div>

                                                    <span>
                                                        PRECIO
                                                    </span>

                                                    <strong>
                                                        $
                                                        {formatPrice(
                                                            service.price
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        MODALIDAD
                                                    </span>

                                                    <strong>
                                                        {
                                                            service.modality
                                                        }
                                                    </strong>

                                                </div>


                                            </div>



                                            {/* LOCATION */}

                                            {service.location && (

                                                <div className="service-location">

                                                    <span>
                                                        UBICACIÓN
                                                    </span>

                                                    <strong>
                                                        {
                                                            service.location
                                                        }
                                                    </strong>

                                                </div>

                                            )}



                                            {/* ACTIONS */}

                                            <div className="service-actions">


                                                <button
                                                    onClick={() =>
                                                        editService(
                                                            service
                                                        )
                                                    }
                                                >
                                                    Editar
                                                </button>


                                                <button
                                                    onClick={() =>
                                                        toggleService(
                                                            service
                                                        )
                                                    }
                                                >
                                                    {service.active
                                                        ? "Desactivar"
                                                        : "Activar"}
                                                </button>


                                                <button
                                                    className="danger"
                                                    onClick={() =>
                                                        deleteService(
                                                            service.id
                                                        )
                                                    }
                                                >
                                                    Eliminar
                                                </button>


                                            </div>

                                        </article>

                                    )
                                )}

                            </div>

                        )}



                    {/* =================================================
                        FORMULARIO
                    ================================================= */}

                    <section className="service-form-section">


                        <div className="service-form-intro">

                            <span className="section-label">

                                {editingId
                                    ? "EDITAR SERVICIO"
                                    : "NUEVO SERVICIO"}

                            </span>


                            <h3>

                                {editingId
                                    ? "Actualiza tu servicio."
                                    : "Crea algo que puedas ofrecer."}

                            </h3>


                            <p>
                                Mientras más clara sea la
                                información, más fácil será
                                para tus clientes entender
                                lo que ofreces.
                            </p>

                        </div>



                        <form
                            className="service-form"
                            onSubmit={
                                handleSubmit
                            }
                        >


                            {/* NOMBRE */}

                            <div className="form-group">

                                <label>
                                    Nombre del servicio
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Ej: Diseño de identidad"
                                    maxLength={150}
                                />

                            </div>



                            {/* CATEGORIA + MODALIDAD */}

                            <div className="form-row">


                                <div className="form-group">

                                    <label>
                                        Categoría
                                    </label>

                                    <select
                                        name="category"
                                        value={
                                            form.category
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {CATEGORIES.map(
                                            category => (

                                                <option
                                                    key={
                                                        category.value
                                                    }
                                                    value={
                                                        category.value
                                                    }
                                                >
                                                    {
                                                        category.label
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>



                                <div className="form-group">

                                    <label>
                                        Modalidad
                                    </label>

                                    <select
                                        name="modality"
                                        value={
                                            form.modality
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        {MODALITIES.map(
                                            modality => (

                                                <option
                                                    key={
                                                        modality.value
                                                    }
                                                    value={
                                                        modality.value
                                                    }
                                                >
                                                    {
                                                        modality.label
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>


                            </div>



                            {/* PRECIO + UBICACION */}

                            <div className="form-row">


                                <div className="form-group">

                                    <label>
                                        Precio
                                    </label>


                                    <div className="price-input">

                                        <span>
                                            $
                                        </span>

                                        <input
                                            type="number"
                                            name="price"
                                            value={
                                                form.price
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="80000"
                                            min="0"
                                        />

                                    </div>

                                </div>



                                <div className="form-group">

                                    <label>
                                        Ubicación
                                    </label>

                                    <input
                                        type="text"
                                        name="location"
                                        value={
                                            form.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Santiago"
                                        maxLength={100}
                                    />

                                </div>


                            </div>



                            {/* DESCRIPCION */}

                            <div className="form-group">

                                <label>
                                    Descripción
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Describe qué incluye tu servicio..."
                                    rows="6"
                                />

                            </div>



                            {/* FOOTER FORM */}

                            <div className="service-form-footer">


                                <label className="active-checkbox">

                                    <input
                                        type="checkbox"
                                        checked={
                                            form.active
                                        }
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                active:
                                                    e.target
                                                        .checked,
                                            })
                                        }
                                    />

                                    <span>
                                        Publicar servicio
                                    </span>

                                </label>



                                <div className="form-buttons">


                                    {editingId && (

                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={
                                                resetForm
                                            }
                                        >
                                            Cancelar
                                        </button>

                                    )}



                                    <button
                                        type="submit"
                                        className="hero-button primary"
                                        disabled={
                                            saving
                                        }
                                    >

                                        {saving
                                            ? "Guardando..."
                                            : editingId
                                                ? "Guardar cambios"
                                                : "Crear servicio"}

                                    </button>


                                </div>


                            </div>


                        </form>


                    </section>


                </div>

            </section>

        </main>

    );

}

export default Services;