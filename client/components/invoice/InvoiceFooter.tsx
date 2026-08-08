export default function InvoiceFooter() {

  return (

    <section
      className="
      mt-16
      border-t
      pt-8
      text-sm
      text-gray-600
      "
    >

      <div
        className="
        grid
        md:grid-cols-2
        gap-10
        "
      >

        {/* LEFT */}

        <div>

          <h2
            className="
            font-bold
            text-lg
            mb-3
            "
          >

            Terms & Conditions

          </h2>

          <ul
            className="
            list-disc
            ml-5
            space-y-2
            "
          >

            <li>
              Goods once sold cannot be returned except under approved return policy.
            </li>

            <li>
              Please keep this invoice for warranty and future reference.
            </li>

            <li>
              Any dispute is subject to Surat jurisdiction only.
            </li>

            <li>
              SilentGEN reserves all rights.
            </li>

          </ul>

        </div>

        {/* RIGHT */}

        <div className="text-right">

          <h2
            className="
            text-lg
            font-bold
            "
          >

            Thank You ❤️

          </h2>

          <p className="mt-3">

            Thank you for shopping with

            <strong>

              {" "}
              SilentGEN

            </strong>

          </p>

          <p className="mt-2">

            www.silentgen.com

          </p>

          <p>

            support@silentgen.com

          </p>

        </div>

      </div>

    </section>

  );

}
