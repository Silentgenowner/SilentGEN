"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";


type AccountGroup = {
  _id: string;

  name: string;

  code: string;

  type:
    | "ASSET"
    | "LIABILITY"
    | "INCOME"
    | "EXPENSE"
    | "EQUITY";

  parent?: {
    name: string;
    code: string;
  } | null;

  isActive: boolean;
};



type ApiResponse = {
  success: boolean;

  data: AccountGroup[];

  pagination: {
    totalGroups: number;

    page: number;

    limit: number;

    totalPages: number;

  };

};



export default function AccountGroupsPage() {


  const [groups, setGroups] =
    useState<AccountGroup[]>([]);


  const [loading, setLoading] =
    useState(true);


  const [search, setSearch] =
    useState("");


  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
  useState(1);

  async function fetchGroups() {

    try {

      setLoading(true);


      const res =
        await fetch(
          `/api/admin/accounts/groups?search=${search}&page=${page}`,
          {
            cache:
              "no-store",
          }
        );


      const data:
        ApiResponse =
        await res.json();


      if(data.success){

       setGroups(
       data.data
      );


     setTotalPages(
     data.pagination.totalPages
     );

     }

    } catch(error){

      console.error(
        error
      );

    } finally {

      setLoading(false);

    }

  }

useEffect(()=>{

  const timer =
    setTimeout(()=>{

      fetchGroups();

    },500);


  return ()=>clearTimeout(timer);


},[
  page,
  search
]);

    return (

    <div className="p-6">


      {/* Header */}

      <div className="mb-6 flex items-center justify-between">


        <div>

          <h1 className="text-2xl font-bold">
            Account Groups
          </h1>

          <p className="text-sm text-gray-500">
            Manage Tally style account groups
          </p>

        </div>



        <div className="flex gap-3">


          <Link
            href="/admin/accounts/groups/trash"
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white"
          >

            <Trash2 size={18}/>

            Trash

          </Link>



          <Link
            href="/admin/accounts/groups/create"
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white"
          >

            <Plus size={18}/>

            Add Group

          </Link>


        </div>


      </div>




      {/* Search */}


      <div className="mb-5 flex items-center gap-3">


        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border px-3 py-2">


          <Search size={18}
            className="text-gray-400"
          />


          <input

            value={search}

            onChange={(e)=>{

              setSearch(
                e.target.value
              );

              setPage(1);

            }}

            placeholder="Search group name or code"

            className="w-full outline-none"

          />


        </div>



        <button

          onClick={
            fetchGroups
          }

          className="rounded-lg bg-gray-900 px-5 py-2 text-white"

        >

          Search

        </button>


      </div>





      {/* Table */}


      <div className="overflow-hidden rounded-xl border">


        <table className="w-full">


          <thead className="bg-gray-100">


            <tr>


              <th className="p-3 text-left">
                Name
              </th>


              <th className="p-3 text-left">
                Code
              </th>


              <th className="p-3 text-left">
                Type
              </th>


              <th className="p-3 text-left">
                Parent
              </th>


              <th className="p-3 text-left">
                Status
              </th>


              <th className="p-3 text-center">
                Action
              </th>


            </tr>


          </thead>
                    <tbody>


            {loading ? (


              <tr>

                <td
                  colSpan={6}
                  className="p-10 text-center"
                >

                  <div className="flex items-center justify-center gap-3">

                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    Loading groups...

                  </div>


                </td>


              </tr>



            ) : groups.length === 0 ? (


              <tr>

                <td
                  colSpan={6}
                  className="p-10 text-center text-gray-500"
                >

                  No account groups found.

                </td>


              </tr>



            ) : (


              groups.map(
                (group)=>(
                  

                  <tr
                    key={group._id}
                    className="border-t hover:bg-gray-50"
                  >


                    <td className="p-3 font-medium">

                      {group.name}

                    </td>



                    <td className="p-3">

                      {group.code}

                    </td>



                    <td className="p-3">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">

                        {group.type}

                      </span>

                    </td>



                    <td className="p-3">


                      {group.parent ? (

                        <div>

                          <p>
                            {group.parent.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            {group.parent.code}
                          </p>

                        </div>


                      ) : (

                        <span className="text-gray-400">
                          Root
                        </span>

                      )}


                    </td>




                    <td className="p-3">


                      {group.isActive ? (

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">

                          Active

                        </span>


                      ) : (

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">

                          Inactive

                        </span>

                      )}


                    </td>





                    <td className="p-3">


                      <div className="flex justify-center gap-2">


                        <Link

                          href={`/admin/accounts/groups/${group._id}/edit`}

                          className="rounded-lg border p-2 hover:bg-gray-100"

                        >

                          <Edit size={16}/>

                        </Link>




                        <button

                          className="rounded-lg border p-2 text-red-600 hover:bg-red-50"

                        >

                          <Trash2 size={16}/>

                        </button>



                      </div>


                    </td>


                  </tr>


                )

              )


            )}


          </tbody>


        </table>


      </div>
            {/* Pagination */}

      <div className="mt-6 flex items-center justify-between">


        <button

          disabled={
            page === 1
          }

          onClick={() =>
            setPage(
              (prev) =>
                Math.max(
                  1,
                  prev - 1
                )
            )
          }

          className="rounded-lg border px-4 py-2 disabled:opacity-40"

        >

          Previous

        </button>



        <span className="text-sm text-gray-500">

          Page {page}

        </span>




        <button

          disabled={
          page >= totalPages
          }

          onClick={() =>
            setPage(
              (prev) =>
                prev + 1
            )
          }


          className="rounded-lg border px-4 py-2"


        >

          Next

        </button>


      </div>


    </div>

  );

}