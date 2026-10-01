import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";


function DejarReview() {

    const navigate = useNavigate();
    const location = useLocation();


    // El ID puede venir desde la página de MisSolicitudes
    const { id } = useParams();


    const serviceRequestId = id;


    const [comment, setComment] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");



    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (!comment.trim()) {

            setError(
                "Escribe un comentario antes de publicar tu reseña."
            );

            return;
        }


        if (!serviceRequestId) {

            setError(
                "No se encontró la contratación asociada a la reseña."
            );

            return;
        }


        setLoading(true);


        try {

            const response = await fetch(
                "http://localhost:8000/api/reviews/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        appointment: serviceRequestId,

                        comment: comment.trim()

                    })

                }
            );


            const data = await response.json();


            console.log("Respuesta API:", data);

            if (!response.ok) {

                setError(
                    data.detail ||
                    data.error ||
                    "No fue posible publicar la reseña."
                );

                return;
            }


            setSuccess(
                "Tu reseña fue publicada correctamente."
            );


            setComment("");


            setTimeout(() => {

                navigate("/mis-solicitudes");

            }, 1500);


        } catch (error) {

            console.error(
                "Error creando reseña:",
                error
            );

            setError(
                "No fue posible conectarse con el servidor."
            );

        } finally {

            setLoading(false);

        }

    };



    return (

        <main className="review-page">


            {/* HERO */}

            <section className="hero-section">

                <div className="hero-content">

                    <span className="hero-label">
                        SKILLY
                    </span>


                    <h1>
                        Comparte tu
                        <br />
                        experiencia.
                    </h1>


                    <p>
                        Cuéntanos cómo fue tu experiencia
                        con el profesional.
                    </p>

                </div>

            </section>



            {/* FORMULARIO */}

            <section className="about-section">

                <div className="section-container">

                    <span className="section-label">
                        RESEÑA DEL SERVICIO
                    </span>


                    <h2>
                        ¿Cómo fue tu
                        <br />
                        experiencia?
                    </h2>



                    <form
                        className="review-form"
                        onSubmit={handleSubmit}
                    >


                        {error && (

                            <div className="review-message error">
                                {error}
                            </div>

                        )}


                        {success && (

                            <div className="review-message success">
                                {success}
                            </div>

                        )}



                        <div className="form-group">

                            <label htmlFor="comment">
                                Tu experiencia
                            </label>


                            <textarea
                                id="comment"
                                name="comment"
                                rows="8"
                                placeholder="Cuéntanos cómo fue el servicio, la atención del profesional y tu experiencia..."
                                value={comment}
                                onChange={(event) =>
                                    setComment(event.target.value)
                                }
                                disabled={loading}
                            />

                        </div>



                        <button
                            type="submit"
                            className="review-submit-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Publicando..."
                                : "Publicar reseña →"}

                        </button>


                    </form>

                </div>

            </section>


        </main>

    );
}


export default DejarReview;