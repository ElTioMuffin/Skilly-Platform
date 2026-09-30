import {
    useEffect,
    useState
} from "react";


function Schedule() {


    const [availability, setAvailability] = useState([]);
    const storedProfile = JSON.parse(
    localStorage.getItem("skillyProfile")
    );  

    const professionalId = storedProfile.id;
    const [form, setForm] = useState({

        day: "lunes",

        start_time: "09:00",

        end_time: "18:00"

    });



    useEffect(() => {

        loadSchedule();

    }, []);




    const loadSchedule = async () => {


        const response = await fetch(

            "http://localhost:8000/api/availability/"

        );


        const data = await response.json();


        setAvailability(data);


    };





    const handleChange = (e) => {


        setForm({

            ...form,

            [e.target.name]:
                e.target.value

        });


    };





    const addSchedule = async () => {


        await fetch(

            "http://localhost:8000/api/availability/",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    professional: professionalId,

                    ...form

                })

            }

        );



        loadSchedule();


    };







    const deleteSchedule = async (id) => {


        await fetch(

            `http://localhost:8000/api/availability/${id}/`,

            {

                method: "DELETE"

            }

        );


        loadSchedule();


    };







    return (


        <main className="professional-page">


            <section className="hero-section">


                <div className="hero-content">


                    <span className="hero-label">

                        SKILLY PROFESIONAL

                    </span>



                    <h1>

                        Gestiona
                        <br />

                        tu disponibilidad.

                    </h1>



                    <p>

                        Define tus horarios para recibir
                        nuevas oportunidades.

                    </p>


                </div>


            </section>









            <section className="about-section">


                <div className="section-container">


                    <span className="section-label">

                        DISPONIBILIDAD

                    </span>




                    <h2>

                        Configura tus
                        <br />

                        horarios.

                    </h2>







                    <div className="schedule-container">





                        <div className="schedule-card">


                            <h3>

                                Nuevo horario

                            </h3>



                            <p>

                                Agrega los bloques donde
                                estás disponible.

                            </p>




                            <div className="schedule-fields">



                                <div className="form-group">

                                    <label>
                                        Día
                                    </label>


                                    <select

                                        name="day"

                                        value={form.day}

                                        onChange={handleChange}

                                    >

                                        <option value="lunes">
                                            Lunes
                                        </option>

                                        <option value="martes">
                                            Martes
                                        </option>

                                        <option value="miercoles">
                                            Miércoles
                                        </option>

                                        <option value="jueves">
                                            Jueves
                                        </option>

                                        <option value="viernes">
                                            Viernes
                                        </option>

                                        <option value="sabado">
                                            Sábado
                                        </option>

                                    </select>

                                </div>






                                <div className="form-group">


                                    <label>
                                        Desde
                                    </label>


                                    <input

                                        type="time"

                                        name="start_time"

                                        value={form.start_time}

                                        onChange={handleChange}

                                    />


                                </div>






                                <div className="form-group">


                                    <label>
                                        Hasta
                                    </label>


                                    <input

                                        type="time"

                                        name="end_time"

                                        value={form.end_time}

                                        onChange={handleChange}

                                    />


                                </div>



                            </div>







                            <button

                                className="hero-button primary"

                                onClick={addSchedule}

                            >

                                Agregar horario

                            </button>




                        </div>









                        <div className="schedule-list">



                            <span className="section-label">

                                HORARIOS ACTIVOS

                            </span>





                            <div className="validation-grid">



                                {

                                    availability.length === 0 ?


                                        (

                                            <div className="empty-state">

                                                <h3>

                                                    No tienes horarios configurados

                                                </h3>


                                                <p>

                                                    Agrega disponibilidad para comenzar
                                                    a recibir reservas.

                                                </p>

                                            </div>

                                        )


                                        :


                                        availability.map(item => (


                                            <div

                                                className="validation-card"

                                                key={item.id}

                                            >


                                                <span className="admin-number">

                                                    DISPONIBLE

                                                </span>



                                                <h3>

                                                    {item.day}

                                                </h3>





                                                <div className="profile-info">


                                                    <p>

                                                        <span>
                                                            Horario
                                                        </span>


                                                        {item.start_time}
                                                        -
                                                        {item.end_time}


                                                    </p>


                                                </div>







                                                <button

                                                    className="reject-button"

                                                    onClick={() =>
                                                        deleteSchedule(item.id)
                                                    }

                                                >

                                                    Eliminar horario

                                                </button>



                                            </div>



                                        ))


                                }



                            </div>


                        </div>





                    </div>


                </div>


            </section>


        </main>


    );


}


export default Schedule;