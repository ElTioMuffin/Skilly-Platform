import {
    useEffect,
    useState
} from "react";



function Incidencias() {


    const [incidents, setIncidents] = useState([]);


    useEffect(() => {

        loadIncidents();

    }, []);



    const loadIncidents = async () => {


        const response = await fetch(

            "http://localhost:8000/api/admin/incidents/"

        );


        const data = await response.json();


        setIncidents(data);


    };




    const changeStatus = async (id, status) => {


        await fetch(

            `http://localhost:8000/api/admin/incidents/${id}/`,

            {

                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    status

                })

            }


        );



        loadIncidents();


    };




    return (


        <main className="admin-page">


            <section className="hero-section">


                <div className="hero-content">


                    <span className="hero-label">

                        SKILLY ADMIN

                    </span>



                    <h1>

                        Gestión
                        <br />
                        de incidencias.

                    </h1>



                    <p>

                        Controla reclamos y conflictos
                        del ecosistema.

                    </p>


                </div>


            </section>






            <section className="about-section">


                <div className="section-container">



                    <span className="section-label">

                        COMPLIANCE

                    </span>



                    <h2>

                        Incidencias
                        <br />
                        reportadas.

                    </h2>





                    <div className="validation-grid">

                        {

                            incidents.length === 0 ? (

                                <div className="empty-state">

                                    <span className="admin-number">
                                        SKILLY
                                    </span>

                                    <h3>
                                        No hay incidencias registradas
                                    </h3>

                                    <p>
                                        Actualmente no existen reclamos o conflictos
                                        pendientes dentro de la plataforma.
                                    </p>

                                </div>


                            )

                                :


                                incidents.map((incident) => (


                                    <div
                                        className="validation-card"
                                        key={incident.id}
                                    >


                                        <span className="admin-number">

                                            #{incident.id}

                                        </span>



                                        <h3>

                                            {incident.title}

                                        </h3>




                                        <div className="profile-info">


                                            <p>

                                                <span>
                                                    Reportado por
                                                </span>

                                                {incident.reporter_name}

                                            </p>



                                            <p>

                                                <span>
                                                    Usuario involucrado
                                                </span>

                                                {incident.affected_name}

                                            </p>



                                            <p>

                                                <span>
                                                    Estado
                                                </span>

                                                {incident.status}

                                            </p>


                                        </div>




                                        <div className="validation-buttons">


                                            <button

                                                className="approve-button"

                                                onClick={() =>
                                                    changeStatus(
                                                        incident.id,
                                                        "review"
                                                    )
                                                }

                                            >

                                                Revisar

                                            </button>




                                            <button

                                                className="approve-button"

                                                onClick={() =>
                                                    changeStatus(
                                                        incident.id,
                                                        "resolved"
                                                    )
                                                }

                                            >

                                                Resolver

                                            </button>


                                        </div>



                                    </div>


                                ))


                        }


                    </div>



                </div>


            </section>



        </main>


    )


}


export default Incidencias;