import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import Validaciones from "./Pages/Admin/Validaciones"
import Incidencias from "./Pages/Admin/Incidencias"
import ProfileEdit from "./Pages/ProfileEdit"
import MyAppointments from "./Pages/MyAppointments"
import Schedule from "./Pages/Schedule";
import Services from "./Pages/Services";
import Notifications from "./Pages/Notifications";
import DejarReview from "./Pages/DejarReview";

import "./App.css";

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
            element={<Marketplace />}
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
            path="/reservas-recibidas"
            element={<ProfessionalBookings />}
          />
          <Route
            path="/admin"
            element={<Admin />}
          />
          <Route
            path="/admin/validaciones"
            element={<Validaciones />}
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
