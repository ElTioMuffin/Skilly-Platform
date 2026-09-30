import {
  useEffect,
  useState
} from "react";

import "./MyAppointments.css"
function MyAppointments() {


  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);


  const [selectedAppointment, setSelectedAppointment] = useState(null);


  const [showModal, setShowModal] = useState(false);



  const [formData, setFormData] = useState({

    new_date:"",
    new_time:"",
    reason:""

  });




  useEffect(()=>{

    loadAppointments();

  },[]);






  const loadAppointments = async()=>{


    try{


      const response = await fetch(

        "http://localhost:8000/api/appointments/"

      );


      const data = await response.json();


      setAppointments(data);



    }catch(error){

      console.error(
        "Error cargando agenda",
        error
      );

    }
    finally{

      setLoading(false);

    }


  };








  const openReschedule = (appointment)=>{


    setSelectedAppointment(
      appointment
    );


    setShowModal(true);


  };







  const handleChange=(e)=>{


    setFormData({

      ...formData,

      [e.target.name]:
      e.target.value

    });


  };









  const sendReschedule = async()=>{


    try{


      await fetch(

      "http://localhost:8000/api/appointments/reschedule/",

      {

        method:"POST",

        headers:{

          "Content-Type":
          "application/json"

        },


        body:JSON.stringify({

          appointment_id:
          selectedAppointment.id,


          new_date:
          formData.new_date,


          new_time:
          formData.new_time,


          reason:
          formData.reason


        })

      }

      );



      setShowModal(false);



      setFormData({

        new_date:"",
        new_time:"",
        reason:""

      });



      alert(
        "Solicitud enviada a la organización"
      );



    }catch(error){


      console.error(error);


    }


  };









  const cancelAppointment = async(id)=>{


    const confirmCancel =
    window.confirm(
      "¿Seguro que deseas cancelar este servicio?"
    );



    if(!confirmCancel)
      return;




    try{


      await fetch(

      `http://localhost:8000/api/appointments/${id}/cancel/`,

      {

        method:"PATCH",

        headers:{

          "Content-Type":
          "application/json"

        }

      }

      );



      loadAppointments();



    }catch(error){


      console.error(error);


    }


  };









  if(loading){


    return(

      <main className="admin-page">

        <h2>
          Cargando agenda...
        </h2>


      </main>

    );


  }








  return(


    <main className="professional-page">






      <section className="hero-section">


        <div className="hero-content">


          <span className="hero-label">

            SKILLY PROFESIONAL

          </span>




          <h1>

            Gestiona
            <br/>
            tus servicios.

          </h1>




          <p>

            Reprograma o cancela servicios
            confirmados cuando sea necesario.

          </p>


        </div>


      </section>









      <section className="about-section">


        <div className="section-container">



          <span className="section-label">

            MI AGENDA

          </span>




          <h2>

            Servicios
            <br/>
            agendados.

          </h2>






          <div className="validation-grid">





          {
          appointments.length === 0 ?


          (

          <div className="empty-state">


            <span className="admin-number">
              SKILLY
            </span>


            <h3>
              No tienes servicios agendados
            </h3>


            <p>
              Cuando tengas contrataciones
              aparecerán aquí.
            </p>


          </div>


          )



          :



          appointments.map((appointment)=>(



          <div

          className="validation-card"

          key={appointment.id}

          >





          <span className="admin-number">

          #{appointment.id}

          </span>







          <h3>

          {
          appointment.service_name ||
          appointment.service
          }

          </h3>






          <div className="profile-info">



          <p>

          <span>
          Fecha
          </span>

          {
          appointment.date
          }

          </p>





          <p>

          <span>
          Hora
          </span>

          {
          appointment.time
          }

          </p>






          <p>

          <span>
          Estado
          </span>


          {
          appointment.status
          }


          </p>



          </div>








          {
          appointment.status === "Confirmada"
          &&


          <div className="validation-buttons">



          <button

          className="approve-button"

          onClick={()=>
          openReschedule(appointment)
          }

          >

          Reprogramar

          </button>





          <button

          className="reject-button"

          onClick={()=>
          cancelAppointment(
          appointment.id
          )
          }

          >

          Cancelar

          </button>



          </div>

          }







          </div>



          ))

          }






          </div>




        </div>


      </section>










      {
      showModal &&

      (

      <div className="modal-overlay">


        <div className="modal-card">



        <h2>

        Nueva fecha

        </h2>




        <input

        type="date"

        name="new_date"

        value={
        formData.new_date
        }

        onChange={handleChange}

        />





        <input

        type="time"

        name="new_time"

        value={
        formData.new_time
        }

        onChange={handleChange}

        />






        <textarea

        name="reason"

        placeholder="Motivo del cambio"

        value={
        formData.reason
        }

        onChange={handleChange}

        />








        <div className="validation-buttons">


        <button

        className="approve-button"

        onClick={sendReschedule}

        >

        Enviar solicitud

        </button>




        <button

        className="reject-button"

        onClick={()=>
        setShowModal(false)
        }

        >

        Cancelar

        </button>


        </div>





        </div>


      </div>


      )

      }








    </main>


  );

}



export default MyAppointments;