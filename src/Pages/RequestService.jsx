import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

function RequestService() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project: "",
    details: "",
    date: "",
    time: "",
    budget: "",
    modality: "",
  });

  useEffect(() => {
    const loadProfessional = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/profesionales/${id}/`
        );

        console.log(
          "Profesional para solicitud:",
          response.data
        );

        setProfessional(response.data);

        if (response.data.services?.length > 0) {
          const mainService = response.data.services[0];

          setFormData((previousData) => ({
            ...previousData,
            modality: mainService.modality || "",
          }));
        }

      } catch (error) {
        console.error(
          "Error al obtener profesional:",
          error
        );

        setError(
          "No se pudo cargar la información del profesional."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfessional();
  }, [id]);


  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const storedUser =
      JSON.parse(
        localStorage.getItem("skillyUser")
      );

    if (!storedUser) {
      setError(
        "Debes iniciar sesión para solicitar un servicio."
      );

      return;
    }

    if (!professional) {
      setError(
        "No se encontró el profesional."
      );

      return;
    }

    const services = Array.isArray(
      professional.services
    )
      ? professional.services
      : [];

    const mainService =
      services.length > 0
        ? services[0]
        : null;

    if (!mainService) {
      setError(
        "Este profesional todavía no tiene servicios disponibles."
      );

      return;
    }

    try {

      const budgetNumber = formData.budget
        ? Number(
            formData.budget
              .replace(/\$/g, "")
              .replace(/\./g, "")
              .replace(/,/g, "")
              .trim()
          )
        : null;


      const requestData = {
        client: storedUser.id,

        professional: professional.id,

        service: mainService.id,

        project: formData.project,

        details: formData.details,

        requested_date:
          formData.date || null,

        requested_time:
          formData.time || null,

        budget: budgetNumber,

        modality: formData.modality,

        status: "Pendiente",
      };


      console.log(
        "Solicitud que se enviará a Django:",
        requestData
      );


      await axios.post(
        "http://127.0.0.1:8000/api/solicitudes/",
        requestData
      );


      setSubmitted(true);

    } catch (error) {

      console.error(
        "Error al enviar solicitud:",
        error
      );

      console.error(
        "Respuesta de Django:",
        error.response?.data
      );

      if (error.response?.data) {

        const backendError =
          error.response.data;

        setError(
          typeof backendError === "string"
            ? backendError
            : "Django rechazó la solicitud. Revisa los datos ingresados."
        );

      } else {

        setError(
          "No fue posible conectarse con el servidor."
        );

      }
    }
  };


  if (loading) {
    return (
      <main className="request-page">

        <div className="request-container">

          <h1>
            Cargando profesional...
          </h1>

          <p>
            Estamos obteniendo la información desde Skilly.
          </p>

        </div>

      </main>
    );
  }


  if (error && !professional) {
    return (
      <main className="request-page">

        <div className="request-container">

          <h1>
            No se pudo cargar el profesional
          </h1>

          <p>
            {error}
          </p>

          <Link to="/marketplace">
            ← Volver al Marketplace
          </Link>

        </div>

      </main>
    );
  }


  if (!professional) {
    return null;
  }


  const services = Array.isArray(
    professional.services
  )
    ? professional.services
    : [];


  const mainService =
    services.length > 0
      ? services[0]
      : null;


  if (submitted) {
    return (
      <main className="request-page">

        <div className="request-container">

          <div className="request-success">

            <span className="section-label">
              SOLICITUD ENVIADA
            </span>

            <h1>
              Tu solicitud fue enviada correctamente.
            </h1>

            <p>
              La solicitud para{" "}
              <strong>
                {professional.full_name}
              </strong>{" "}
              quedó registrada como pendiente.
            </p>

            <div className="request-success-actions">

              <Link
                to="/mis-solicitudes"
                className="request-service-button"
              >
                Ver mis solicitudes
              </Link>

              <Link
                to="/marketplace"
                className="back-link"
              >
                ← Volver al Marketplace
              </Link>

            </div>

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="request-page">

      <div className="request-container">

        <Link
          to={`/profesional/${professional.id}`}
          className="back-link"
        >
          ← Volver al perfil
        </Link>


        <section className="request-header">

          <span className="section-label">
            NUEVA SOLICITUD
          </span>

          <h1>
            Solicitar servicio
          </h1>

          <p>
            Envía una solicitud a{" "}
            <strong>
              {professional.full_name}
            </strong>{" "}
            para comenzar tu proyecto.
          </p>

        </section>


        <section className="request-professional">

          <div className="profile-photo">

            <span>
              {professional.full_name
                ?.charAt(0)
                .toUpperCase()}
            </span>

          </div>

          <div>

            <h2>
              {professional.full_name}
            </h2>

            <p>
              {professional.profession}
            </p>

            {mainService && (
              <span>
                {mainService.name}
              </span>
            )}

          </div>

        </section>


        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        <form
          className="request-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label htmlFor="project">
              Nombre del proyecto
            </label>

            <input
              id="project"
              name="project"
              type="text"
              placeholder="Ej. Diseño de página web"
              value={formData.project}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="details">
              Cuéntanos sobre tu proyecto
            </label>

            <textarea
              id="details"
              name="details"
              rows="6"
              placeholder="Describe lo que necesitas..."
              value={formData.details}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-grid">

            <div className="form-group">

              <label htmlFor="date">
                Fecha estimada
              </label>

              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="time">
                Hora propuesta
              </label>

              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="budget">
                Presupuesto
              </label>

              <input
                id="budget"
                name="budget"
                type="text"
                placeholder="Ej. $100.000"
                value={formData.budget}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          <div className="form-group">

            <label htmlFor="modality">
              Modalidad
            </label>

            <select
              id="modality"
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              required
            >

              <option value="">
                Selecciona una modalidad
              </option>

              <option value="Remoto">
                Remoto
              </option>

              <option value="Híbrido">
                Híbrido
              </option>

              <option value="Presencial">
                Presencial
              </option>

            </select>

          </div>


          <button
            type="submit"
            className="request-submit-button"
          >
            Enviar solicitud
          </button>

        </form>

      </div>

    </main>
  );
}

export default RequestService;
