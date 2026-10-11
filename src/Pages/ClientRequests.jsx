import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

function ClientRequests() {
  const [searchParams] = useSearchParams();
  const highlightedRequestId = searchParams.get("solicitud");
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [reviewText, setReviewText] = useState({});
  const [reviewOpen, setReviewOpen] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState({});
  const [paymentOpen, setPaymentOpen] = useState({});
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [paymentFeedback, setPaymentFeedback] = useState({});


  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!highlightedRequestId || !requests.length) return;
    document.getElementById(`client-request-${highlightedRequestId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [highlightedRequestId, requests]);


  const loadRequests = async () => {
    try {
      setError("");

      const storedUser = JSON.parse(
        localStorage.getItem("skillyUser")
      );

      if (!storedUser) {
        setError(
          "Debes iniciar sesión para ver tus solicitudes."
        );

        setLoading(false);
        return;
      }


      // Obtener solicitudes
      const requestsResponse = await axios.get(
        "http://127.0.0.1:8000/api/solicitudes/"
      );


      // Obtener profesionales
      const professionalsResponse = await axios.get(
        "http://127.0.0.1:8000/api/profesionales/"
      );


      // Obtener reseñas
      const reviewsResponse = await axios.get(
        "http://127.0.0.1:8000/api/resenas/"
      );


      const allRequests =
        requestsResponse.data;

      const professionals =
        professionalsResponse.data;

      const allReviews =
        reviewsResponse.data;


      // Solo mostrar solicitudes del usuario conectado
      const userRequests = allRequests
        .filter(
          (request) =>
            Number(request.client) ===
            Number(storedUser.id)
        )
        .map((request) => {

          const professional =
            professionals.find(
              (item) =>
                Number(item.id) ===
                Number(request.professional)
            );


          const service =
            professional?.services?.find(
              (item) =>
                Number(item.id) ===
                Number(request.service)
            );


          return {
            ...request,

            professionalName:
              professional?.full_name ||
              "Profesional",

            professionalProfession:
              professional?.profession ||
              "",

            professionalService:
              service?.name ||
              "Servicio",

            professionalId:
              professional?.id ||
              request.professional,
          };
        });


      setRequests(userRequests);
      setReviews(allReviews);

    } catch (error) {

      console.error(
        "Error al obtener solicitudes:",
        error
      );

      console.error(
        "Respuesta de Django:",
        error.response?.data
      );

      setError(
        "No se pudieron cargar tus solicitudes."
      );

    } finally {
      setLoading(false);
    }
  };


  const toggleReview = (requestId) => {

    setReviewOpen((previous) => ({
      ...previous,
      [requestId]:
        !previous[requestId],
    }));

    setReviewError("");
  };


  const handleReviewChange = (
    requestId,
    value
  ) => {

    setReviewText((previous) => ({
      ...previous,
      [requestId]: value,
    }));
  };

  const simulatePayment = async (request, outcome) => {
    const storedUser = JSON.parse(localStorage.getItem("skillyUser") || "null");
    if (!storedUser?.id) return;
    setPaymentLoading(request.id);
    setPaymentFeedback((current) => ({ ...current, [request.id]: null }));
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/solicitudes/${request.id}/pay/`,
        { client: storedUser.id, outcome }
      );
      const result = response.data;
      setRequests((current) => current.map((item) => item.id === request.id
        ? { ...item, payment_status: result.payment_status }
        : item));
      setPaymentFeedback((current) => ({
        ...current,
        [request.id]: { message: result.message, success: result.success },
      }));
      if (result.success) {
        setPaymentOpen((current) => ({ ...current, [request.id]: false }));
      }
    } catch (error) {
      setPaymentFeedback((current) => ({
        ...current,
        [request.id]: {
          message: error.response?.data?.error || "No se pudo procesar el pago.",
          success: false,
        },
      }));
    } finally {
      setPaymentLoading(null);
    }
  };


  const submitReview = async (request) => {

    try {

      setReviewError("");

      setReviewSuccess({});


      const storedUser = JSON.parse(
        localStorage.getItem("skillyUser")
      );


      if (!storedUser) {
        setReviewError(
          "Debes iniciar sesión para dejar una reseña."
        );
        return;
      }


      const comment =
        reviewText[request.id]?.trim();


      if (!comment) {
        setReviewError(
          "Escribe un comentario antes de publicar la reseña."
        );
        return;
      }


      if (comment.length < 5) {
        setReviewError(
          "La reseña debe tener al menos 5 caracteres."
        );
        return;
      }


      // Verificar nuevamente que no exista una reseña
      const existingReview =
        reviews.find(
          (review) =>
            Number(review.service_request) ===
            Number(request.id)
        );


      if (existingReview) {
        setReviewError(
          "Esta solicitud ya tiene una reseña."
        );
        return;
      }


      // Crear reseña en Django
      const response = await axios.post(
        "http://127.0.0.1:8000/api/resenas/",
        {
          service_request: request.id,
          client: storedUser.id,
          professional: request.professionalId,
          comment: comment,
        }
      );


      // Guardar la nueva reseña localmente
      setReviews((previousReviews) => [
        ...previousReviews,
        response.data,
      ]);


      // Limpiar formulario
      setReviewText((previous) => ({
        ...previous,
        [request.id]: "",
      }));


      setReviewOpen((previous) => ({
        ...previous,
        [request.id]: false,
      }));


      setReviewSuccess((previous) => ({
        ...previous,
        [request.id]:
          "Tu reseña fue publicada correctamente.",
      }));

    } catch (error) {

      console.error(
        "Error al publicar reseña:",
        error
      );

      console.error(
        "Respuesta de Django:",
        error.response?.data
      );


      if (
        error.response?.data
      ) {

        console.error(
          "Detalle del error:",
          error.response.data
        );
      }


      setReviewError(
        "No se pudo publicar la reseña. Revisa los datos e inténtalo nuevamente."
      );
    }
  };


  const getReviewForRequest = (
    requestId
  ) => {

    return reviews.find(
      (review) =>
        Number(review.service_request) ===
        Number(requestId)
    );
  };


  if (loading) {

    return (
      <main className="client-requests-page">

        <div className="client-requests-container">

          <Link
            to="/marketplace"
            className="back-link"
          >
            ← Volver al Marketplace
          </Link>

          <section className="client-requests-header">

            <span className="section-label">
              MIS SOLICITUDES
            </span>

            <h1>
              Mis solicitudes de servicio
            </h1>

            <p>
              Cargando tus solicitudes...
            </p>

          </section>

        </div>

      </main>
    );
  }


  return (
    <main className="client-requests-page">

      <div className="client-requests-container">

        <Link
          to="/marketplace"
          className="back-link"
        >
          ← Volver al Marketplace
        </Link>


        <section className="client-requests-header">

          <span className="section-label">
            MIS SOLICITUDES
          </span>

          <h1>
            Mis solicitudes de servicio
          </h1>

          <p>
            Revisa las solicitudes que has enviado
            y conoce su estado.
          </p>


          <Link
            to="/marketplace"
            className="new-request-button"
          >
            + Nueva solicitud
          </Link>

        </section>


        {error && (
          <div className="login-error">
            {error}
          </div>
        )}


        {reviewError && (
          <div className="login-error">
            {reviewError}
          </div>
        )}


        {!error && requests.length === 0 && (

          <div className="no-client-requests">

            <h2>
              Todavía no tienes solicitudes.
            </h2>

            <p>
              Cuando solicites un servicio,
              aparecerá aquí.
            </p>

            <Link
              to="/marketplace"
              className="request-back-button"
            >
              Buscar profesionales
            </Link>

          </div>

        )}


        {!error && requests.length > 0 && (

          <div className="client-requests-list">

            {requests.map((request) => {

              const existingReview =
                getReviewForRequest(
                  request.id
                );


              return (
                <article
                  className={`client-request-card${String(request.id) === highlightedRequestId ? " request-card-highlighted" : ""}`}
                  key={request.id}
                  id={`client-request-${request.id}`}
                >

                  <div className="client-request-header">

                    <div>

                      <span className="section-label">
                        SOLICITUD
                      </span>

                      <h2>
                        {request.project}
                      </h2>

                    </div>


                    <span
                      className={`client-request-status client-request-status-${request.status
                        ?.toLowerCase()
                        .normalize("NFD")
                        .replace(
                          /[\u0300-\u036f]/g,
                          ""
                        )
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >
                      {request.status}
                    </span>

                  </div>


                  <div className="client-request-professional">

                    <h3>
                      Profesional
                    </h3>

                    <p>
                      {request.professionalName}
                    </p>

                    <span>
                      {request.professionalService}
                    </span>

                    {request.professionalProfession && (
                      <small>
                        {request.professionalProfession}
                      </small>
                    )}

                  </div>


                  <div className="client-request-details">

                    <h3>
                      Tu solicitud
                    </h3>

                    <p>
                      {request.details}
                    </p>

                  </div>


                  <div className="client-request-information">

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


                  <Link
                    to={`/profesional/${request.professionalId}`}
                    className="client-request-profile-button"
                  >
                    Ver perfil del profesional →
                  </Link>

                  {request.status === "Completada" && request.payment_status === "Pagado" && (
                    <div className="client-payment-paid">✓ Pago completado</div>
                  )}

                  {request.status === "Completada" && request.payment_status !== "Pagado" && (
                    <section className="client-payment-section">
                      <div className="client-payment-heading">
                        <div>
                          <span className="section-label">ORDEN COMPLETADA</span>
                          <h3>Tu orden está lista para pagar</h3>
                          <p>Pago de demostración · no se realizará un cobro real.</p>
                        </div>
                        {request.budget && (
                          <strong className="client-payment-amount">
                            ${Number(request.budget).toLocaleString("es-CL")}
                          </strong>
                        )}
                      </div>

                      {!paymentOpen[request.id] ? (
                        <button
                          type="button"
                          className="client-payment-button"
                          onClick={() => setPaymentOpen((current) => ({ ...current, [request.id]: true }))}
                        >
                          Realizar pago
                        </button>
                      ) : (
                        <div className="client-payment-flows">
                          <p>Elige un resultado para simular el flujo:</p>
                          <button type="button" disabled={paymentLoading === request.id} onClick={() => simulatePayment(request, "success")}>
                            Pago correcto
                          </button>
                          <button type="button" disabled={paymentLoading === request.id} onClick={() => simulatePayment(request, "failure")}>
                            Pago fallido
                          </button>
                          <button type="button" disabled={paymentLoading === request.id} onClick={() => simulatePayment(request, "insufficient_balance")}>
                            Saldo insuficiente
                          </button>
                          <button type="button" disabled={paymentLoading === request.id} onClick={() => simulatePayment(request, "unknown_error")}>
                            Error desconocido
                          </button>
                          <button type="button" className="client-payment-cancel" onClick={() => setPaymentOpen((current) => ({ ...current, [request.id]: false }))}>
                            Volver
                          </button>
                        </div>
                      )}
                      {paymentLoading === request.id && <p className="client-payment-feedback">Procesando pago de demostración…</p>}
                      {paymentFeedback[request.id] && (
                        <p className={`client-payment-feedback${paymentFeedback[request.id].success ? " success" : " failure"}`}>
                          {paymentFeedback[request.id].message}
                        </p>
                      )}
                    </section>
                  )}


                  {/* RESEÑA */}

                  {request.status === "Completada" && (

                    <div className="client-review-section">

                      {existingReview ? (

                        <div className="client-review-published">

                          <h3>
                            Reseña publicada
                          </h3>

                          <p>
                            "{existingReview.comment}"
                          </p>

                          <small>
                            Tu reseña ya fue registrada.
                          </small>

                        </div>

                      ) : (

                        <>

                          {!reviewOpen[request.id] && (

                            <button
                              type="button"
                              className="client-review-button"
                              onClick={() =>
                                toggleReview(
                                  request.id
                                )
                              }
                            >
                              Dejar una reseña
                            </button>

                          )}


                          {reviewOpen[request.id] && (

                            <div className="client-review-form">

                              <h3>
                                Cuéntanos tu experiencia
                              </h3>

                              <p>
                                Escribe una reseña sobre
                                tu experiencia con{" "}
                                {request.professionalName}.
                              </p>


                              <textarea
                                value={
                                  reviewText[
                                    request.id
                                  ] || ""
                                }
                                onChange={(event) =>
                                  handleReviewChange(
                                    request.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Escribe aquí tu experiencia..."
                                rows="5"
                              />


                              <div className="client-review-form-actions">

                                <button
                                  type="button"
                                  className="client-review-submit"
                                  onClick={() =>
                                    submitReview(
                                      request
                                    )
                                  }
                                >
                                  Publicar reseña
                                </button>


                                <button
                                  type="button"
                                  className="client-review-cancel"
                                  onClick={() =>
                                    toggleReview(
                                      request.id
                                    )
                                  }
                                >
                                  Cancelar
                                </button>

                              </div>

                            </div>

                          )}

                        </>

                      )}


                      {reviewSuccess[request.id] && (
                        <p className="client-review-success">
                          {reviewSuccess[request.id]}
                        </p>
                      )}

                    </div>

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

export default ClientRequests;
