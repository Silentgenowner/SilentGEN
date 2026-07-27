"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


type User = {

  name?: string;

  email?: string;

  mobile?: string;

  isProfileCompleted?: boolean;

};



export default function ProfilePage(){


  const router = useRouter();


  const [user,setUser] =
  useState<User>({});


  const [loading,setLoading] =
  useState(true);


  const [saving,setSaving] =
  useState(false);


  const [editMode,setEditMode] =
  useState(false);



  const [form,setForm] =
  useState({

    name:"",
    email:"",
    mobile:""

  });





  useEffect(()=>{

    loadProfile();

  },[]);






  async function loadProfile(){


    try{


      const res =
      await fetch(

        "/api/user/profile",

        {
          cache:"no-store"
        }

      );



      const data =
      await res.json();




      if(data.success){


        setUser(data.user);



        setForm({

          name:data.user.name || "",

          email:data.user.email || "",

          mobile:data.user.mobile || ""

        });





        // first login profile incomplete

        if(!data.user.isProfileCompleted){

          setEditMode(true);

        }



      }


    }
    catch(error){


      console.log(
        "PROFILE LOAD ERROR",
        error
      );


    }
    finally{


      setLoading(false);


    }


  }







  function handleChange(
    e:React.ChangeEvent<HTMLInputElement>
  ){


    setForm({

      ...form,

      [e.target.name]:
      e.target.value

    });


  }







  async function saveProfile(){


    try{


      setSaving(true);



      const res =
      await fetch(

        "/api/user/profile",

        {

          method:"PUT",

          headers:{

            "Content-Type":
            "application/json"

          },


          body:
          JSON.stringify(form)

        }

      );




      const data =
      await res.json();





      if(data.success){


        setUser(data.user);


        setEditMode(false);



        alert(
          "Profile updated successfully"
        );


      }
      else{


        alert(
          data.message
        );


      }




    }
    catch(error){


      console.log(error);


      alert(
        "Something went wrong"
      );


    }
    finally{


      setSaving(false);


    }


  }







  if(loading){


    return(

      <div className="p-10 text-center">

        Loading Profile...

      </div>

    );

  }







  return(


    <div className="max-w-4xl mx-auto px-6 py-10">


      <h1 className="text-3xl font-bold mb-8">

        My Profile

      </h1>





      <div className="
      border
      rounded-xl
      p-6
      space-y-6
      ">




      {
        editMode ?


        <>


          <div>

            <label>
              Name
            </label>


            <input

            name="name"

            value={form.name}

            onChange={handleChange}

            className="
            w-full
            border
            rounded-lg
            p-3
            mt-2
            "

            />

          </div>





          <div>

            <label>
              Email
            </label>


            <input

            name="email"

            value={form.email}

            onChange={handleChange}

            className="
            w-full
            border
            rounded-lg
            p-3
            mt-2
            "

            />

          </div>





          <div>

            <label>
              Mobile
            </label>


            <input

            name="mobile"

            value={form.mobile}

            onChange={handleChange}

            className="
            w-full
            border
            rounded-lg
            p-3
            mt-2
            "

            />

          </div>





          <button

          onClick={saveProfile}

          disabled={saving}

          className="
          bg-black
          text-white
          px-6
          py-3
          rounded-lg
          "

          >

          {
            saving
            ?
            "Saving..."
            :
            "Save Profile"
          }


          </button>



        </>



        :


        <>


        <div>

          <p className="text-gray-500">
            Name
          </p>

          <p className="font-semibold text-lg">
            {user.name}
          </p>

        </div>





        <div>

          <p className="text-gray-500">
            Email
          </p>

          <p className="font-semibold text-lg">
            {user.email || "Not Added"}
          </p>

        </div>





        <div>

          <p className="text-gray-500">
            Mobile
          </p>

          <p className="font-semibold text-lg">
            {user.mobile}
          </p>

        </div>





        <button

        onClick={()=>setEditMode(true)}

        className="
        bg-black
        text-white
        px-6
        py-3
        rounded-lg
        "

        >

        Edit Profile

        </button>



        </>


      }



      </div>


    </div>


  );


}
