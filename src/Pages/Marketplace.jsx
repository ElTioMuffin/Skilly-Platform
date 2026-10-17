import { useEffect, useState } from "react";
import axios from "axios";
import ServiceCard from "../Components/ServiceCard";

function Marketplace() {
  const [services, setServices] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas las categorías");
  const [modality, setModality] = useState("Todas las modalidades");
  const [location, setLocation] = useState("Todas las ubicaciones");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const loadServices = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/services/",
          { signal: controller.signal, timeout: 10000 }
        );

        if (!Array.isArray(response.data)) {
          throw new Error("La respuesta del servidor no contiene una lista de servicios.");
        }
        setServices(response.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(
          "Error al obtener servicios disponibles:",
          error
        );

        setServices([]);
        setError(error.code === "ECONNABORTED"
          ? "La solicitud tardó demasiado. Intenta nuevamente."
          : error.response
            ? `El servidor respondió con un error (${error.response.status}).`
            : error.message || "No se pudo conectar con el servidor.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadServices();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredServices = services.filter((service) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        service.professional_name
          ?.toLowerCase()
          .includes(searchText) ||
        service.professional_profession
          ?.toLowerCase()
          .includes(searchText) ||
        service.name?.toLowerCase().includes(searchText) ||
        service.description?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "Todas las categorías" ||
        service.category === category;

      const matchesModality =
        modality === "Todas las modalidades" ||
        service.modality === modality;

      const matchesLocation =
        location === "Todas las ubicaciones" ||
        (service.location || service.professional_location) === location;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesModality &&
        matchesLocation
      );
    }
  );

  return (
    <main className="marketplace">

      <section className="marketplace-header">

        <span className="section-label">
          MARKETPLACE
        </span>

        <h1>
          Encuentra el servicio
          <br />
          que necesitas.
        </h1>

        <p>
          Descubre talento experto para tus proyectos,
          servicios y necesidades.
        </p>

      </section>


      <section className="marketplace-search">

        <div className="search-box">

          <span className="search-icon">
            🔎
          </span>

          <input
            type="text"
            placeholder="Busca por servicio, profesional o especialidad"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <div className="marketplace-filters">

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            <option>
              Todas las categorías
            </option>

            <option>
              Diseño
            </option>

            <option>
              Desarrollo
            </option>

            <option>
              Marketing
            </option>

            <option>
              Otro
            </option>

          </select>


          <select
            value={modality}
            onChange={(event) =>
              setModality(event.target.value)
            }
          >
            <option>
              Todas las modalidades
            </option>

            <option>
              Remoto
            </option>

            <option>
              Híbrido
            </option>

            <option>
              Presencial
            </option>

          </select>


          <select
            value={location}
            onChange={(event) =>
              setLocation(event.target.value)
            }
          >
            <option>
              Todas las ubicaciones
            </option>

            <option>
              Santiago
            </option>

            <option>
              Valparaíso
            </option>

            <option>
              Concepción
            </option>

          </select>

        </div>

      </section>


      <section className="marketplace-results">

        <div className="results-header">

          <div>

            <span className="section-label">
              SERVICIOS DISPONIBLES
            </span>

            <h2>
              Servicios
            </h2>

          </div>


          {!loading && !error && (
            <span className="results-count">

              {filteredServices.length}{" "}

              {filteredServices.length === 1
                ? "servicio"
                : "servicios"}

            </span>
          )}

        </div>


        {loading && (

          <div className="no-results">

            <h3>
              Cargando servicios...
            </h3>

            <p>
              Estamos buscando servicios aprobados
              y disponibles.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="no-results">

            <h3>
              No se pudieron cargar los servicios disponibles.
            </h3>

            <p>
              {error}
            </p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Intentar de nuevo
            </button>

          </div>

        )}


        {!loading &&
          !error &&
          filteredServices.length > 0 && (

            <div className="professionals-grid">

              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}

            </div>

          )}


        {!loading &&
          !error &&
          filteredServices.length === 0 && (

            <div className="no-results">

              <h3>
                No encontramos servicios disponibles.
              </h3>

              <p>
                Aquí solo aparecen servicios activos aprobados. Prueba con otra búsqueda o modifica los filtros; si publicaste un servicio, debe ser aprobado por un admin para aparecer.
              </p>

            </div>

          )}

      </section>

    </main>
  );
}

export default Marketplace;
