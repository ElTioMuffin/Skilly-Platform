import { useEffect, useState } from "react";
import "./Validaciones.css"


function Validaciones() {


  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    fetchProfiles();

  }, []);



  const fetchProfiles = async () => {

    try {

      const response = await fetch(
        "http://localhost:8000/api/admin/profiles/pending/"
      )


      const data = await response.json();



      const pendingProfiles = data.filter(
        profile => profile.validated === false
      );


      setProfiles(pendingProfiles);


    } catch (error) {

      console.error(
        "Error cargando perfiles:",
        error
      );

    }
    finally {

      setLoading(false);

    }

  };

  const approveProfile = async (id) => {


    try {


      const response = await fetch(
        `http://localhost:8000/api/admin/profiles/${id}/validate/`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            validated: true
          })

        }
      );



      if (response.ok) {

        setProfiles(
          profiles.filter(
            profile => profile.id !== id
          )
        );

      }


    } catch (error) {

      console.error(error);

    }

  };





  const rejectProfile = async (id) => {


    try {


      await fetch(
        `http://localhost:8000/api/profiles/${id}/`,
        {

          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            validated: false

          })

        }
      );



    } catch (error) {

      console.error(error);

    }


  };





  if (loading) {

    return (

      <main className="admin-page">

        <h2>
          Cargando validaciones...
        </h2>

      </main>

    );

  }





  return (


    <main className="admin-page">



      <section className="hero-section">


        <div className="hero-content">


          <span className="hero-label">

            SKILLY ADMIN

          </span>



          <h1>

            Validación
            <br />
            de profesionales.

          </h1>



          <p>

            Revisa y aprueba perfiles antes
            de publicarlos en el marketplace.

          </p>


        </div>


      </section>







      <section className="about-section">


        <div className="section-container">



          <span className="section-label">

            PERFILES PENDIENTES

          </span>




          <h2>

            Usuarios esperando
            <br />
            validación.

          </h2>





          <div className="validation-grid">



            {
              profiles.length === 0 ?


                (

                  <p>

                    No existen perfiles pendientes.

                  </p>

                )


                :

                profiles.map(profile => (

                  <div
                    className="validation-card"
                    key={profile.id}
                  >


                    <span className="admin-number">
                      #{profile.id}
                    </span>


                    <h3>
                      {profile.full_name}
                    </h3>



                    <div className="profile-info">


                      <p>
                        <span>
                          Rol
                        </span>

                        {profile.role}
                      </p>


                      <p>
                        <span>
                          Profesión
                        </span>

                        {profile.profession || "Sin especificar"}
                      </p>


                      <p>
                        <span>
                          Ubicación
                        </span>

                        {profile.location || "No registrada"}
                      </p>


                    </div>



                    <div className="validation-buttons">


                      <button

                        className="approve-button"

                        onClick={() =>
                          approveProfile(profile.id)
                        }

                      >

                        Aceptar perfil

                      </button>




                      <button

                        className="reject-button"

                        onClick={() =>
                          rejectProfile(profile.id)
                        }

                      >

                        Rechazar

                      </button>


                    </div>



                  </div>


                ))
            }



          </div>




        </div>


      </section>




    </main>


  );

}



export default Validaciones;