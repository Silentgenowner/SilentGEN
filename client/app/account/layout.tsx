import Link from "next/link";
import {
  User,
  MapPin,
  Package,
  Heart,
  Settings,
  Bell,
} from "lucide-react";


export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (

    <div className="max-w-7xl mx-auto px-6 py-10">


      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">


        {/* Sidebar */}

        <aside className="border rounded-xl p-5 h-fit">


          <h2 className="text-xl font-bold mb-6">
            My Account
          </h2>




          <nav className="flex flex-col gap-3">



            <Link
              href="/account/profile"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <User size={20}/>

              Profile

            </Link>





            <Link
              href="/account/address"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <MapPin size={20}/>

              Address

            </Link>





            <Link
              href="/account/orders"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <Package size={20}/>

              Orders

            </Link>





            <Link
              href="/account/wishlist"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <Heart size={20}/>

              Wishlist

            </Link>





            <Link
              href="/account/settings"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <Settings size={20}/>

              Settings

            </Link>





            <Link
              href="/account/notifications"
              className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg"
            >

              <Bell size={20}/>

              Notifications

            </Link>



          </nav>


        </aside>





        {/* Page Content */}

        <main className="md:col-span-3">


          {children}


        </main>




      </div>


    </div>

  );

}
