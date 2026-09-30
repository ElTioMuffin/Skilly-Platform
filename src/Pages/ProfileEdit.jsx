import {
    useEffect,
    useState
} from "react";

import "./ProfileEdit.css"


function ProfileEdit() {


    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");



    useEffect(() => {


        const storedProfile = localStorage.getItem(
            "skillyProfile"
        );


        if (storedProfile) {

            setProfile(
                JSON.parse(storedProfile)
            );

        }


        setLoading(false);


    }, []);





    const handleChange = (e) => {


        const {
            name,
            value
        } = e.target;



        setProfile({

            ...profile,

            [name]: value

        });


    };





    const handleSubmit = async (e) => {


        e.preventDefault();


        try {
            const user = JSON.parse(
                localStorage.getItem("skillyUser")
            );


            const response = await fetch(

                "http://localhost:8000/api/professional/profile/update/",

                {

                    method: "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },




                    body: JSON.stringify({

                        profile_id: profile.id,
                        user_id: user.id,
                        profession:
                            profile.profession,
                        bio:
                            profile.bio,
                        location:
                            profile.location,

                    })


                }


            );



            const data = await response.json();



            if (response.ok) {


                setMessage(
                    "Perfil actualizado correctamente."
                );


                localStorage.setItem(

                    "skillyProfile",

                    JSON.stringify(profile)

                );


            }
            else {


                setMessage(
                    data.error ||
                    "No fue posible actualizar."
                );


            }



        } catch (error) {


            console.error(error);


            setMessage(
                "Error conectando con el servidor."
            );


        }


    };





    if (loading) {

        return (

            <main className="admin-page">

                <h2>
                    Cargando perfil...
                </h2>

            </main>

        );

    }




    if (!profile) {

        return (

            <main className="admin-page">

                <h2>
                    No existe perfil profesional.
                </h2>

            </main>

        );

    }





    return (


        <main className="professional-page">



            <section className="hero-section">


                <div className="hero-content">


                    <span className="hero-label">

                        SKILLY PROFESIONAL

                    </span>



                    <h1>

                        Actualiza
                        <br />
                        tu perfil.

                    </h1>



                    <p>

                        Mantén tu experiencia,
                        servicios y disponibilidad
                        siempre actualizados.

                    </p>


                </div>


            </section>







            <section className="about-section">


                <div className="section-container">



                    <span className="section-label">

                        INFORMACIÓN PROFESIONAL

                    </span>



                    <h2>

                        Editar perfil

                    </h2>




                    {

                        message && (

                            <div className="profile-message">

                                {message}

                            </div>

                        )

                    }





                    <form

                        className="profile-edit-form"

                        onSubmit={handleSubmit}

                    >





                        <div className="form-group">


                            <label>
                                Nombre completo
                            </label>


                            <input

                                value={
                                    profile.full_name || ""
                                }

                                disabled

                            />


                            <small>

                                🔒 Validado por KYC

                            </small>


                        </div>







                        <div className="form-group">


                            <label>
                                Profesión
                            </label>


                            <input

                                name="profession"

                                value={
                                    profile.profession || ""
                                }

                                onChange={handleChange}

                            />



                        </div>







                        <div className="form-group">


                            <label>
                                Ubicación
                            </label>


                            <input

                                name="location"

                                value={
                                    profile.location || ""
                                }

                                onChange={handleChange}

                            />


                        </div>








                        <div className="form-group">


                            <label>
                                Descripción profesional
                            </label>



                            <textarea

                                name="bio"

                                rows="6"

                                value={
                                    profile.bio || ""
                                }

                                onChange={handleChange}

                            />



                        </div>







                        <button

                            className="login-submit-button"

                            type="submit"

                        >

                            Guardar cambios

                        </button>




                    </form>




                </div>


            </section>





        </main>


    );


}


export default ProfileEdit;