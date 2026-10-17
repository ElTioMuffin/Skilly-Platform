import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Admin.css";
import "./Panel.css";

const API_URL = "http://127.0.0.1:8000/api/master/admins/";

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
};

function MasterPanel() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAdminId, setUpdatingAdminId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAdmins = useCallback(async () => {
    const token = localStorage.getItem("skillyMasterToken");
    if (!token) {
      setError("Inicia sesión con la cuenta superusuario para abrir el panel maestro.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("skillyMasterToken");
        }
        throw new Error(data.error || "No se pudo cargar la lista de admins.");
      }
      setAdmins(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("skillyMasterToken") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la cuenta admin.");
      }

      setAdmins((current) => [...current, data].sort((a, b) => a.username.localeCompare(b.username)));
      setForm(emptyForm);
      setMessage(`La cuenta admin ${data.username} fue creada. No tiene permisos de superusuario.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAdmin = async (admin) => {
    setUpdatingAdminId(admin.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("skillyMasterToken") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: admin.id, is_active: !admin.is_active }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado de la cuenta.");
      }
      setAdmins((current) => current.map((item) => item.id === data.id ? data : item));
      setMessage(`La cuenta ${data.username} quedó ${data.is_active ? "habilitada" : "deshabilitada"}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingAdminId(null);
    }
  };

  return (
    <main className="admin-page">
      <section className="about-section">
        <div className="section-container">
          <span className="section-label">SKILLY · PANEL MAESTRO</span>
          <h1>Administrar cuentas.</h1>
          <p>Solo las cuentas superusuario pueden crear admins. Los admins creados podrán revisar servicios y gestionar el panel, pero no administrar otras cuentas.</p>
          <p><Link to="/admin">← Volver al panel admin</Link></p>

          {error && <p role="alert" className="master-alert">{error}</p>}
          {message && <p role="status" className="master-message">{message}</p>}

          <section className="master-form-card">
            <h2>Crear cuenta admin</h2>
            <form onSubmit={createAdmin} className="master-admin-form">
              <label>
                Usuario
                <input name="username" value={form.username} onChange={handleChange} autoComplete="off" required />
              </label>
              <label>
                Correo
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Nombre
                <input name="first_name" value={form.first_name} onChange={handleChange} />
              </label>
              <label>
                Apellido
                <input name="last_name" value={form.last_name} onChange={handleChange} />
              </label>
              <label className="master-password-field">
                Contraseña inicial
                <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" required />
              </label>
              <button type="submit" className="approve-button" disabled={saving}>
                {saving ? "Creando..." : "Crear admin"}
              </button>
            </form>
          </section>

          <section className="master-admin-list">
            <h2>Cuentas admin</h2>
            {loading && <p>Cargando cuentas...</p>}
            {!loading && admins.length === 0 && <p>No hay cuentas admin creadas.</p>}
            {admins.map((admin) => (
              <article className="master-admin-row" key={admin.id}>
                <div>
                  <strong>{admin.username}</strong>
                  <span>{[admin.first_name, admin.last_name].filter(Boolean).join(" ") || "Sin nombre"}</span>
                </div>
                <div>
                  <span>{admin.email}</span>
                  <span>{admin.is_active ? "Activa" : "Desactivada"}</span>
                </div>
                <button
                  type="button"
                  className={admin.is_active ? "master-disable-button" : "master-enable-button"}
                  onClick={() => toggleAdmin(admin)}
                  disabled={updatingAdminId === admin.id}
                >
                  {updatingAdminId === admin.id
                    ? "Actualizando..."
                    : admin.is_active ? "Deshabilitar" : "Habilitar"}
                </button>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

export default MasterPanel;
