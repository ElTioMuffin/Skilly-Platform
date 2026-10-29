import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./Components/Navbar";

import Home from "./Pages/Home";
import Marketplace from "./Pages/Marketplace";
import ProfessionalProfile from "./Pages/ProfessionalProfile";
import RequestService from "./Pages/RequestService";
import ProfessionalRequests from "./Pages/ProfessionalRequests";
import ClientRequests from "./Pages/ClientRequests";
import ComoFunciona from "./Pages/ComoFunciona";
import Login from "./Pages/Login";
import Registro from "./Pages/Registro";
import ReservarHora from "./Pages/ReservarHora";
import MisReservas from "./Pages/MisReservas";
import ProfessionalBookings from "./Pages/ProfessionalBookings";
import Admin from "./Pages/Admin"
import ServiciosPendientes from "./Pages/Admin/Servicios"
import Incidencias from "./Pages/Admin/Incidencias"
import ProfileEdit from "./Pages/ProfileEdit"
import MyAppointments from "./Pages/MyAppointments"
import Schedule from "./Pages/Schedule";
import Services from "./Pages/Services";
import Notifications from "./Pages/Notifications";
import DejarReview from "./Pages/DejarReview";
import PaymentPortal from "./Pages/PaymentPortal";
import MasterPanel from "./Pages/Master/Panel";

import "./App.css";

function MarketplaceRoute() {
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem("skillyProfile") || "null");
  } catch {
    profile = null;
  }

  if (profile?.role === "professional") {
    return <Navigate to="/servicios" replace />;
  }

  return <Marketplace />;
}

function App() {
  return (
    <BrowserRouter>

      <div className="app">

        <Navbar />

        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/marketplace"
            element={<MarketplaceRoute />}
          />

          <Route
            path="/profesional/:id"
            element={<ProfessionalProfile />}
          />

          <Route
            path="/solicitar-servicio/:id"
            element={<RequestService />}
          />

          <Route
            path="/solicitudes/:id"
            element={<ProfessionalRequests />}
          />

          <Route
            path="/mis-solicitudes"
            element={<ClientRequests />}
          />

          <Route
            path="/como-funciona"
            element={<ComoFunciona />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/registro"
            element={<Registro />}
          />

          <Route
            path="/reservar/:id"
            element={<ReservarHora />}
          />

          <Route
            path="/mis-reservas"
            element={<MisReservas />}
          />
          <Route
            path="/pago/:type/:id"
            element={<PaymentPortal />}
          />

          <Route
            path="/reservas-recibidas"
            element={<ProfessionalBookings />}
          />
          <Route
            path="/admin"
            element={<Admin />}
          />
          <Route
            path="/master/admins"
            element={<MasterPanel />}
          />
          <Route
            path="/admin/servicios"
            element={<ServiciosPendientes />}
          />
          <Route
            path="/admin/incidencias"
            element={<Incidencias />}
          />
          <Route path="/mi-perfil"
            element={<ProfileEdit />}
          />

          <Route path="/mis-servicios"
            element={<MyAppointments />}
          />

          <Route
            path="/horarios"
            element={<Schedule />}
          />
          <Route
            path="/servicios"
            element={<Services />}
          />
          <Route
            path="/notificaciones"
            element={<Notifications />}
          />
          <Route
            path="/dejar-review/:id"
            element={<DejarReview />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;
