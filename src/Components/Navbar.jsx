import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import "./Navbar.css";


function Navbar() {


  const navigate = useNavigate();


  const [unreadCount, setUnreadCount] = useState(0);



  const storedUser =
    localStorage.getItem("skillyUser");


  const storedProfile =
    localStorage.getItem("skillyProfile");



  const user = storedUser
    ? JSON.parse(storedUser)
    : null;



  const profile = storedProfile
    ? JSON.parse(storedProfile)
    : null;



  const isLoggedIn = !!user;


  const isAdmin =
    user?.is_staff === true;



  const isProfessional =
    profile?.role === "professional";



  const isOrganization =
    profile?.role === "organization";






  useEffect(() => {


    if (
      !isProfessional ||
      !user?.id
    ) {

      setUnreadCount(0);

      return;

    }




    const loadUnread = async () => {


      try {


        const response =
          await fetch(

            `http://127.0.0.1:8000/api/notifications/?user=${user.id}`

          );



        if (!response.ok)
          return;



        const data =
          await response.json();



        const notifications =
          Array.isArray(data)
            ? data
            : data.results || [];



        setUnreadCount(

          notifications.filter(
            item => !item.is_read
          ).length

        );



      } catch (error) {

        console.error(error);

      }


    };



    loadUnread();



    const interval =
      setInterval(
        loadUnread,
        5000
      );



    return () => clearInterval(interval);



  }, [
    isProfessional,
    user?.id
  ]);










  const handleLogout = () => {


    localStorage.removeItem(
      "skillyUser"
    );


    localStorage.removeItem(
      "skillyProfile"
    );


    navigate("/login");


  };





  return (

    <header className="navbar">


      <div className="navbar-container">



        <Link
          to="/"
          className="navbar-logo"
        >
          SKILLY
        </Link>





        <nav className="navbar-menu">



          {/* SIN LOGIN */}

          {
            !isLoggedIn && (

              <>

                <Link to="/">
                  Inicio
                </Link>


                <Link to="/marketplace">
                  Profesionales
                </Link>


                <Link to="/como-funciona">
                  Cómo funciona
                </Link>


              </>

            )

          }






          {/* ADMIN */}

          {
            isAdmin && (

              <>

                <Link to="/admin">
                  Dashboard
                </Link>


                <Link to="/admin/incidencias">
                  Incidencias
                </Link>


              </>

            )

          }







          {/* PROFESIONAL */}

          {
            isProfessional && !isAdmin && (

              <>

                <Link to="/">
                  Inicio
                </Link>


                <Link to="/marketplace">
                  Profesionales
                </Link>


                <Link to="/horarios">
                  Mi disponibilidad
                </Link>


                <Link to="/reservas-recibidas">
                  Reservas recibidas
                </Link>


                <Link to="/servicios">
                  Servicios
                </Link>



                <Link
                  to="/notificaciones"
                  className="navbar-notifications-link"
                >

                  Notificaciones


                  {
                    unreadCount > 0 && (

                      <span
                        className="navbar-notification-count"
                      >
                        {unreadCount}
                      </span>

                    )

                  }


                </Link>


              </>

            )

          }









          {/* ORGANIZACION */}

          {
            isOrganization && !isAdmin && (

              <>

                <Link to="/">
                  Inicio
                </Link>


                <Link to="/marketplace">
                  Profesionales
                </Link>


                <Link to="/mis-reservas">
                  Mis reservas
                </Link>


              </>

            )

          }




        </nav>








        <div className="navbar-actions">



          {/* PERFIL PROFESIONAL */}

          {
            isProfessional && (

              <button

                className="logout-button"

                onClick={() =>
                  navigate("/mi-perfil")
                }

              >

                Editar Perfil

              </button>

            )

          }





          {/* PERFIL ORGANIZACION */}

          {
            isOrganization && (

              <button

                className="logout-button"

                onClick={() =>
                  navigate("/mi-perfil")
                }

              >

                Mi perfil

              </button>

            )

          }






          {/* LOGIN */}

          {
            isLoggedIn ?


              (

                <button

                  className="logout-button"

                  onClick={handleLogout}

                >

                  Cerrar sesión

                </button>

              )


              :

              (

                <>

                  <Link
                    to="/login"
                    className="login-link"
                  >
                    Iniciar sesión
                  </Link>


                  <Link
                    to="/registro"
                    className="register-button"
                  >
                    Registrarse
                  </Link>


                </>

              )


          }



        </div>





      </div>


    </header>


  );

}


export default Navbar;