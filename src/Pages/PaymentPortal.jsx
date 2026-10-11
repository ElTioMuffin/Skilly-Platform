import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const TEST_CARDS = [
  { number: "4242 4242 4242 4242", label: "Pago correcto", outcome: "success" },
  { number: "4000 0000 0000 0002", label: "Pago fallido", outcome: "failure" },
  { number: "4000 0000 0000 9995", label: "Saldo insuficiente", outcome: "insufficient_balance" },
  { number: "4000 0000 0000 0119", label: "Error desconocido", outcome: "unknown_error" },
];

function PaymentPortal() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("skillyUser") || "null");
  const [order, setOrder] = useState(null);
  const [serviceName, setServiceName] = useState("Servicio");
  const [serviceAmount, setServiceAmount] = useState(null);
  const [professionalName, setProfessionalName] = useState("Profesional");
  const [selectedCard, setSelectedCard] = useState(TEST_CARDS[0]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const isReservation = type === "reserva";
  const collection = isReservation ? "reservas" : "solicitudes";
  const returnPath = isReservation ? "/mis-reservas" : "/mis-solicitudes";

  useEffect(() => {
    let cancelled = false;
    const loadPayment = async () => {
      if (!user?.id || !["reserva", "orden"].includes(type)) {
        setError("No se pudo identificar la orden de pago.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/${collection}/${id}/`);
        const payment = response.data;
        if (Number(payment.client) !== Number(user.id)) {
          throw new Error("Esta orden no pertenece a tu cuenta.");
        }
        if (payment.status !== "Completada") {
          throw new Error("Esta orden todavía no está lista para pagar.");
        }
        if (cancelled) return;
        setOrder(payment);

        if (isReservation) {
          const profileResponse = await axios.get(`${API_URL}/profesionales/${payment.professional}/`);
          const professional = profileResponse.data;
          setProfessionalName(professional.full_name || "Profesional");
          const service = professional.services?.find((item) => Number(item.id) === Number(payment.service));
          setServiceName(service?.name || "Servicio");
          setServiceAmount(service?.price ?? null);
        } else {
          const professionalResponse = await axios.get(`${API_URL}/profesionales/${payment.professional}/`);
          const professional = professionalResponse.data;
          setProfessionalName(professional.full_name || "Profesional");
          const service = professional.services?.find((item) => Number(item.id) === Number(payment.service));
          setServiceName(service?.name || "Servicio contratado");
          setServiceAmount(payment.budget ?? service?.price ?? null);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.response?.data?.detail || loadError.message || "No se pudo cargar la orden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPayment();
    return () => { cancelled = true; };
  }, [collection, id, isReservation, type, user?.id]);

  const amount = serviceAmount;

  const handlePay = async () => {
    if (!user?.id || !order) return;
    setPaying(true);
    setError("");
    setResult(null);
    try {
      const response = await axios.post(
        `${API_URL}/${collection}/${id}/pay/`,
        { client: user.id, outcome: selectedCard.outcome }
      );
      setResult(response.data);
      setOrder((current) => ({ ...current, payment_status: response.data.payment_status }));
    } catch (payError) {
      setError(payError.response?.data?.error || "No se pudo procesar el pago simulado.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <main className="payment-portal"><div className="payment-portal-card">Cargando portal de pago…</div></main>;
  }

  if (error && !order) {
    return (
      <main className="payment-portal">
        <div className="payment-portal-card">
          <h1>No se pudo abrir el pago</h1>
          <p>{error}</p>
          <Link to={returnPath} className="payment-back-link">Volver a mis órdenes</Link>
        </div>
      </main>
    );
  }

  if (order?.payment_status === "Pagado" || result?.success) {
    return (
      <main className="payment-portal">
        <section className="payment-portal-card payment-result-success">
          <span className="payment-result-icon">✓</span>
          <span className="section-label">PAGO SIMULADO</span>
          <h1>Pago realizado correctamente</h1>
          <p>Se notificó al profesional que el pago de {serviceName} fue realizado.</p>
          <Link to={returnPath} className="payment-submit-button">Volver a mis órdenes</Link>
        </section>
      </main>
    );
  }

  if ((result && !result.success) || error) {
    return (
      <main className="payment-portal">
        <section className="payment-portal-card payment-result-failure">
          <span className="payment-result-icon failure">!</span>
          <span className="section-label">ESTADO DEL PAGO</span>
          <h1>Fallido</h1>
          <p className="payment-failure-reason">
            {result?.message || error || "No se pudo procesar el pago."}
          </p>
          <p>
            Flujo simulado: {selectedCard.label} · Tarjeta {selectedCard.number}
          </p>
          <div className="payment-error-actions">
            <button
              type="button"
              className="payment-submit-button"
              onClick={() => {
                setError("");
                setResult(null);
                setSelectedCard(TEST_CARDS[0]);
              }}
            >
              Reintentar pago
            </button>
            <Link to={returnPath} className="payment-return-button">
              Volver a {isReservation ? "mis reservas" : "mis solicitudes"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-portal">
      <div className="payment-portal-wrap">
        <Link to={returnPath} className="payment-back-link">← Volver</Link>
        <section className="payment-portal-card">
          <header className="payment-portal-header">
            <span className="section-label">PORTAL DE PAGO</span>
            <h1>Completa tu pago</h1>
            <p>Pago de demostración. No se realizará ningún cobro real.</p>
          </header>

          <div className="payment-order-summary">
            <div><span>Servicio</span><strong>{serviceName}</strong></div>
            <div><span>Profesional</span><strong>{professionalName}</strong></div>
            <div><span>Orden</span><strong>#{id}</strong></div>
            {amount != null && <div><span>Total</span><strong>${Number(amount).toLocaleString("es-CL")}</strong></div>}
          </div>

          <div className="payment-test-card-list">
            <h2>Tarjetas de prueba</h2>
            <p>Selecciona una tarjeta simulada para ver el resultado correspondiente.</p>
            {TEST_CARDS.map((card) => (
              <button
                type="button"
                key={card.outcome}
                className={`payment-test-card${selectedCard.outcome === card.outcome ? " selected" : ""}`}
                aria-pressed={selectedCard.outcome === card.outcome}
                onClick={() => setSelectedCard(card)}
              >
                <span className="payment-card-chip" aria-hidden="true">▦</span>
                <span className="payment-card-details">
                  <strong>{card.number}</strong>
                  <small>SKILLY TEST · 12/30</small>
                </span>
                <span className="payment-card-flow">{card.label}</span>
              </button>
            ))}
          </div>

          <button type="button" className="payment-submit-button" disabled={paying} onClick={handlePay}>
            {paying ? "Procesando simulación…" : `Pagar${amount != null ? ` $${Number(amount).toLocaleString("es-CL")}` : ""}`}
          </button>
          <small className="payment-simulation-note">Estos números solo seleccionan escenarios de prueba y no representan tarjetas válidas para cobros.</small>
        </section>
      </div>
    </main>
  );
}

export default PaymentPortal;
