"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";



type AccountGroup = {
  _id: string;

  name: string;

  code: string;
};



const accountTypes = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
  "EQUITY",
] as const;



export default function CreateAccountGroupPage() {


  const router =
    useRouter();



  const [loading,setLoading] =
    useState(false);



  const [groups,setGroups] =
    useState<AccountGroup[]>([]);



  const [form,setForm] =
    useState({

      name:"",

      code:"",

      type: "ASSET" as
    | "ASSET"
    | "LIABILITY"
    | "INCOME"
    | "EXPENSE"
    | "EQUITY",

      parent:"",

      description:"",

    });




  async function fetchParentGroups(){

    try{

      const res =
        await fetch(
          "/api/admin/accounts/groups?limit=100",
          {
            cache:
              "no-store",
          }
        );


      const data =
        await res.json();


      if(data.success){

        setGroups(
          data.groups || data.data || []
        );

      }


    }catch(error){

      console.error(error);

    }

  }



  useEffect(()=>{

    fetchParentGroups();

  },[]);
    async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();


    if (
      !form.name.trim()
    ) {

      alert(
        "Group name is required."
      );

      return;

    }


    try {

      setLoading(true);



      const res =
        await fetch(
          "/api/admin/accounts/groups",
          {
            method:
              "POST",

            headers:{
              "Content-Type":
                "application/json",
            },


            body: JSON.stringify({

            name:
            form.name.trim(),
 
            code:
            form.code.trim(),

            type:
            form.type,

            parent:
            form.parent || null,

            description:
            form.description.trim(),

           })
          }
        );



      const data =
        await res.json();



      if(!data.success){

        alert(
          data.message ||
          "Unable to create group."
        );

        return;

      }



      alert(
        "Account group created successfully."
      );



      router.push(
        "/admin/accounts/groups"
      );

       router.refresh();

    } catch(error){

      console.error(error);

      alert(
        "Something went wrong."
      );


    } finally {

      setLoading(false);

    }

  }




  return (

    <div className="p-6">


      <div className="mb-6">


        <h1 className="text-2xl font-bold">

          Create Account Group

        </h1>


        <p className="text-sm text-gray-500">

          Create Tally style accounting group

        </p>


      </div>




      <form

        onSubmit={
          handleSubmit
        }

        className="max-w-2xl space-y-5 rounded-xl border p-6"

      >


        <div>


          <label className="mb-1 block text-sm font-medium">

            Group Name

          </label>


          <input

            value={
              form.name
            }


            onChange={(e)=>
              setForm({
                ...form,
                name:
                  e.target.value,
              })
            }


            className="w-full rounded-lg border px-3 py-2"

            placeholder="Example: Sundry Debtors"

          />


        </div>
                <div>


          <label className="mb-1 block text-sm font-medium">

            Group Code

          </label>


          <input


            value={
              form.code
            }


            onChange={(e)=>

              setForm({

                ...form,

                code:
                  e.target.value
                    .toUpperCase(),

              })

            }


            className="w-full rounded-lg border px-3 py-2"


            placeholder="Example: SUNDRY_DEBTORS"

          />


        </div>





        <div>


          <label className="mb-1 block text-sm font-medium">

            Account Type

          </label>


          <select


            value={
              form.type
            }


            onChange={(e)=>

              setForm({

                ...form,

               type: e.target.value as
                    | "ASSET"
                    | "LIABILITY"
                    | "INCOME"
                    | "EXPENSE"
                    | "EQUITY",


              })

            }


            className="w-full rounded-lg border px-3 py-2"


          >


            {accountTypes.map(
              (type)=>(
                
                <option
                  key={type}
                  value={type}
                >

                  {type}

                </option>

              )
            )}


          </select>


        </div>





        <div>


          <label className="mb-1 block text-sm font-medium">

            Parent Group

          </label>


          <select


            value={
              form.parent
            }


            onChange={(e)=>

              setForm({

                ...form,

                parent:
                  e.target.value,

              })

            }


            className="w-full rounded-lg border px-3 py-2"


          >


            <option value="">


              No Parent (Root)


            </option>


            {groups.map(
              (group)=>(

                <option

                  key={
                    group._id
                  }

                  value={
                    group._id
                  }

                >

                  {group.name}
                  {" "}
                  (
                  {group.code}
                  )

                </option>

              )
            )}


          </select>


        </div>
                <div>


          <label className="mb-1 block text-sm font-medium">

            Description

          </label>



          <textarea


            value={
              form.description
            }


            onChange={(e)=>

              setForm({

                ...form,

                description:
                  e.target.value,

              })

            }


            rows={4}


            className="w-full rounded-lg border px-3 py-2"


            placeholder="Optional description"

          />


        </div>





        <div className="flex gap-3">


          <button


            type="button"


            onClick={() =>
              router.back()
            }


            className="rounded-lg border px-5 py-2"


          >

            Cancel

          </button>





          <button


            type="submit"


            disabled={
              loading
            }


            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"


          >

            {loading
              ? "Creating..."
              : "Create Group"
            }


          </button>


        </div>



      </form>


    </div>

  );

}