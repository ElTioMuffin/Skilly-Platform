import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

function ProfessionalRequests() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightedRequestId = searchParams.get("solicitud");

  const [professional, setProfessional] = useState(null);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setError("");

      // Obtener profesional desde Django
      const professionalResponse = await axios.get(
        `http://127.0.0.1:8000/api/profesionales/${id}/`
      );

      // Obtener solicitudes desde Django
      const requestsResponse = await axios.get(
        "http://127.0.0.1:8000/api/solicitudes/"
      );

      const professionalData =
        professionalResponse.data;

      const allRequests =
        requestsResponse.data;

      // Solo solicitudes dirigidas a este profesional
      const professionalRequests =
        allRequests.filter(
          (request) =>
            Number(request.professional) ===
            Number(id)
        );

      setProfessional(professionalData);
      setRequests(professionalRequests);

    } catch (error) {
      console.error(
        "Error al cargar solicitudes:",
        error
      );

      console.error(
        "Respuesta de Django:",
        error.response?.data
      );

      setError(
        "No se pudieron cargar las solicitudes."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!highlightedRequestId || !requests.length) return;
    document.getElementById(`request-${highlightedRequestId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedRequestId, requests]);


  const updateRequestStatus = async (
    requestId,
    newStatus
  ) => {
    try {
      setError("");

      await axios.patch(
        `http://127.0.0.1:8000/api/solicitudes/${requestId}/`,
        {
          status: newStatus,
        }
      );

      // Actualizar inmediatamente la pantalla
      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: newStatus,
              }
            : request
        )
      );

    } catch (error) {
      console.error(
        "Error al actualizar solicitud:",
        error
      );

      console.error(
        "Respuesta de Django:",
        error.response?.data
      );

      setError(
        "No se pudo actualizar el estado de la solicitud."
      );
    }
  };


  if (loading) {
    return (
      <main className="requests-page">

        <div className="requests-container">

          <Link
            to="/marketplace"
            className="back-link"
          >
            ← Volver al Marketplace
          </Link>

          <section className="requests-header">

            <span className="section-label">
              SOLICITUDES RECIBIDAS
            </span>

            <h1>
              Cargando solicitudes...
            </h1>

            <p>
              Estamos obteniendo las solicitudes
              desde Skilly.
            </p>

          </section>

        </div>

      </main>
    );
  }


  if (!professional) {
    return (
      <main className="requests-page">

        <div className="requests-container">

          <h1>
            Profesional no encontrado
          </h1>

          <Link to="/marketplace">
            ← Volver al Marketplace
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main className="requests-page">

      <div className="requests-container">

        <Link
          to={`/profesional/${professional.id}`}
          className="back-link"
        >
          ← Volver al perfil
        </Link>


        <section className="requests-header">

          <span className="section-label">
            SOLICITUDES RECIBIDAS
          </span>

          <h1>
            Solicitudes de{" "}
            {professional.full_name}
          </h1>

          <p>
            Revisa las solicitudes de los clientes
            y decide si quieres aceptar o rechazar
            cada proyecto.
          </p>

        </section>


        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {requests.length === 0 ? (

          <div className="no-requests">

            <h2>
              Todavía no tienes solicitudes.
            </h2>

            <p>
              Cuando un cliente solicite tu servicio,
              aparecerá aquí.
            </p>

          </div>

        ) : (

          <div className="requests-list">

            {requests.map((request) => (

              <article
                className={`request-card${String(request.id) === highlightedRequestId ? " request-card-highlighted" : ""}`}
                key={request.id}
                id={`request-${request.id}`}
              >

                <div className="request-card-header">

                  <div>

                    <span className="section-label">
                      SOLICITUD
                    </span>

                    <h2>
                      {request.project}
                    </h2>

                  </div>


                  <span
                    className={`request-status request-status-${request.status
                      ?.toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/\s+/g, "-")}`}
                  >
                    {request.status}
                  </span>

                </div>


                <div className="request-client">

                  <h3>
                    Datos del cliente
                  </h3>

                  <p>
                    <strong>
                      Usuario:
                    </strong>{" "}
                    Usuario #{request.client}
                  </p>

                </div>


                <div className="request-details">

                  <h3>
                    Detalles del proyecto
                  </h3>

                  <p>
                    {request.details}
                  </p>

                </div>


                <div className="request-information">

                  <div>

                    <span>
                      Fecha estimada
                    </span>

                    <strong>
                      {request.requested_date
                        ? new Date(
                            request.requested_date +
                              "T00:00:00"
                          ).toLocaleDateString(
                            "es-CL"
                          )
                          : "No especificada"}
                      {request.requested_time && (
                        <> · {request.requested_time.slice(0, 5)}</>
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Presupuesto
                    </span>

                    <strong>
                      {request.budget
                        ? `$${Number(
                            request.budget
                          ).toLocaleString(
                            "es-CL"
                          )}`
                        : "No especificado"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Modalidad
                    </span>

                    <strong>
                      {request.modality}
                    </strong>

                  </div>

                </div>


                {/* SOLICITUD PENDIENTE */}

                {request.status === "Pendiente" && (

                  <div className="request-actions">

                    <button
                      type="button"
                      className="request-accept-button"
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "Aceptada"
                        )
                      }
                    >
                      ✓ Aceptar solicitud
                    </button>


                    <button
                      type="button"
                      className="request-reject-button"
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "Rechazada"
                        )
                      }
                    >
                      Rechazar solicitud
                    </button>

                  </div>

                )}


                {/* SOLICITUD ACEPTADA */}

                {request.status === "Aceptada" && (

                  <div className="request-actions">

                    <button
                      type="button"
                      className="request-accept-button"
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "Completada"
                        )
                      }
                    >
                      ✓ Marcar como completada
                    </button>

                  </div>

                )}


                {/* SOLICITUD COMPLETADA */}

                {request.status === "Completada" && (

                  <div className="request-completed-message">

                    ✓ Este proyecto ha sido completado.

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

export default ProfessionalRequests;
