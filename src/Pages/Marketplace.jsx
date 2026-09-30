import { useEffect, useState } from "react";
import axios from "axios";
import ProfessionalCard from "../Components/ProfessionalCard";

function Marketplace() {
  const [professionals, setProfessionals] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas las categorías");
  const [modality, setModality] = useState("Todas las modalidades");
  const [location, setLocation] = useState("Todas las ubicaciones");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/profesionales/"
        );

        console.log("Profesionales recibidos:", response.data);

        setProfessionals(response.data);
      } catch (error) {
        console.error(
          "Error al obtener profesionales:",
          error
        );

        setError(
          "No se pudieron cargar los profesionales."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfessionals();
  }, []);

  const filteredProfessionals = professionals.filter(
    (professional) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        professional.full_name
          ?.toLowerCase()
          .includes(searchText) ||
        professional.profession
          ?.toLowerCase()
          .includes(searchText) ||
        professional.services?.some((service) =>
          service.name
            ?.toLowerCase()
            .includes(searchText)
        );

      const matchesCategory =
        category === "Todas las categorías" ||
        professional.services?.some(
          (service) =>
            service.category === category
        );

      const matchesModality =
        modality === "Todas las modalidades" ||
        professional.services?.some(
          (service) =>
            service.modality === modality
        );

      const matchesLocation =
        location === "Todas las ubicaciones" ||
        professional.location === location ||
        professional.services?.some(
          (service) =>
            service.location === location
        );

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
          Encuentra el profesional
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
            placeholder="Busca por profesional, servicio o especialidad"
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
              TALENTO DISPONIBLE
            </span>

            <h2>
              Profesionales
            </h2>

          </div>


          {!loading && !error && (
            <span className="results-count">

              {filteredProfessionals.length}{" "}

              {filteredProfessionals.length === 1
                ? "profesional"
                : "profesionales"}

            </span>
          )}

        </div>


        {loading && (

          <div className="no-results">

            <h3>
              Cargando profesionales...
            </h3>

            <p>
              Estamos obteniendo los profesionales
              desde Skilly.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="no-results">

            <h3>
              No se pudieron cargar los profesionales.
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error &&
          filteredProfessionals.length > 0 && (

            <div className="professionals-grid">

              {filteredProfessionals.map(
                (professional) => (

                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                  />

                )
              )}

            </div>

          )}


        {!loading &&
          !error &&
          filteredProfessionals.length === 0 && (

            <div className="no-results">

              <h3>
                No encontramos profesionales.
              </h3>

              <p>
                Prueba con otra búsqueda o modifica
                los filtros.
              </p>

            </div>

          )}

      </section>

    </main>
  );
}

export default Marketplace;