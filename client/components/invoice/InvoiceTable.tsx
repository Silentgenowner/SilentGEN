type Item = {
  product?: {
    _id: string;
    name: string;
  };

  name: string;
  image: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
};

type Props = {
  items: Item[];
};

export default function InvoiceTable({
  items,
}: Props) {

  return (

    <section className="mb-10">

      <h2
        className="
        text-xl
        font-bold
        mb-5
        "
      >

        Ordered Products

      </h2>

      <div className="overflow-x-auto">

        <table
          className="
          w-full
          border
          border-gray-300
          "
        >

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-3">
                Image
              </th>

              <th className="border p-3">
                Product
              </th>

              <th className="border p-3">
                Size
              </th>

              <th className="border p-3">
                Color
              </th>

              <th className="border p-3">
                Qty
              </th>

              <th className="border p-3">
                Price
              </th>

              <th className="border p-3">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            {

              items.map(

                (item,index)=>(

                  <tr
                    key={index}
                  >

                    <td className="border p-3">

                      <img

                        src={
                          item.image ||
                          "/images/no-image.png"
                        }

                        alt={item.name}

                        className="
                        w-16
                        h-16
                        object-cover
                        rounded
                        "

                      />

                    </td>

                    <td className="border p-3">

                      <div className="font-semibold">

                        {item.name}

                      </div>

                      {

                        item.product?._id &&

                        <div
                          className="
                          text-xs
                          text-gray-500
                          mt-1
                          "
                        >

                          SKU :
                          {" "}
                          {item.product._id.slice(-8).toUpperCase()}

                        </div>

                      }

                    </td>

                    <td className="border p-3">

                      {item.size || "-"}

                    </td>

                    <td className="border p-3">

                      {item.color || "-"}

                    </td>

                    <td className="border p-3 text-center">

                      {item.quantity}

                    </td>

                    <td className="border p-3">

                      ₹{item.price}

                    </td>

                    <td className="border p-3 font-semibold">

                      ₹{item.price * item.quantity}

                    </td>

                  </tr>

                )

              )

            }

          </tbody>

        </table>

      </div>

    </section>

  );

}
