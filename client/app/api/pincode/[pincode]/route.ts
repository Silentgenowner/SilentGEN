import {
  NextRequest,
  NextResponse,
} from "next/server";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    pincode: string;
  }>;
};

type PostalOffice = {
  Name?: string;

  Description?: string;

  BranchType?: string;

  DeliveryStatus?: string;

  Circle?: string;

  District?: string;

  Division?: string;

  Region?: string;

  Block?: string;

  State?: string;

  Country?: string;

  Pincode?: string;
};

type PostalApiItem = {
  Message?: string;

  Status?: string;

  PostOffice?:
    | PostalOffice[]
    | null;
};

/*
|--------------------------------------------------------------------------
| CLEAN STRING
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
|--------------------------------------------------------------------------
| UNIQUE STRINGS
|--------------------------------------------------------------------------
*/

function uniqueStrings(
  values: unknown[]
): string[] {
  const map =
    new Map<
      string,
      string
    >();

  for (const item of values) {
    const value =
      cleanString(item);

    if (!value) {
      continue;
    }

    const key =
      value.toLowerCase();

    if (!map.has(key)) {
      map.set(
        key,
        value
      );
    }
  }

  return Array.from(
    map.values()
  ).sort((a, b) =>
    a.localeCompare(b)
  );
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STATE
|--------------------------------------------------------------------------
*/

function normalizeStateName(
  state: string
): string {
  const value =
    cleanString(state)
      .toLowerCase();

  const stateMap: Record<
    string,
    string
  > = {
    "andaman & nicobar islands":
      "Andaman and Nicobar Islands",

    "andaman and nicobar islands":
      "Andaman and Nicobar Islands",

    "andhra pradesh":
      "Andhra Pradesh",

    "arunachal pradesh":
      "Arunachal Pradesh",

    assam:
      "Assam",

    bihar:
      "Bihar",

    chandigarh:
      "Chandigarh",

    chhattisgarh:
      "Chhattisgarh",

    "dadra & nagar haveli":
      "Dadra and Nagar Haveli and Daman and Diu",

    "dadra and nagar haveli":
      "Dadra and Nagar Haveli and Daman and Diu",

    "daman & diu":
      "Dadra and Nagar Haveli and Daman and Diu",

    "daman and diu":
      "Dadra and Nagar Haveli and Daman and Diu",

    "dadra and nagar haveli and daman and diu":
      "Dadra and Nagar Haveli and Daman and Diu",

    delhi:
      "Delhi",

    goa:
      "Goa",

    gujarat:
      "Gujarat",

    haryana:
      "Haryana",

    "himachal pradesh":
      "Himachal Pradesh",

    "jammu & kashmir":
      "Jammu and Kashmir",

    "jammu and kashmir":
      "Jammu and Kashmir",

    jharkhand:
      "Jharkhand",

    karnataka:
      "Karnataka",

    kerala:
      "Kerala",

    ladakh:
      "Ladakh",

    lakshadweep:
      "Lakshadweep",

    "madhya pradesh":
      "Madhya Pradesh",

    maharashtra:
      "Maharashtra",

    manipur:
      "Manipur",

    meghalaya:
      "Meghalaya",

    mizoram:
      "Mizoram",

    nagaland:
      "Nagaland",

    odisha:
      "Odisha",

    orissa:
      "Odisha",

    puducherry:
      "Puducherry",

    pondicherry:
      "Puducherry",

    punjab:
      "Punjab",

    rajasthan:
      "Rajasthan",

    sikkim:
      "Sikkim",

    "tamil nadu":
      "Tamil Nadu",

    telangana:
      "Telangana",

    tripura:
      "Tripura",

    "uttar pradesh":
      "Uttar Pradesh",

    uttarakhand:
      "Uttarakhand",

    "west bengal":
      "West Bengal",
  };

  if (
    stateMap[value]
  ) {
    return stateMap[value];
  }

  return cleanString(
    state
  );
}

/*
|--------------------------------------------------------------------------
| GET PINCODE
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { pincode } =
      await context.params;

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PINCODE
    |--------------------------------------------------------------------------
    */

    if (
      !/^\d{6}$/.test(
        pincode
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Please enter a valid 6 digit pincode.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH POSTAL DATA
    |--------------------------------------------------------------------------
    */

    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, 8000);

    let response: Response;

    try {
      response =
        await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`,
          {
            method: "GET",

            cache:
              "no-store",

            signal:
              controller.signal,

            headers: {
              Accept:
                "application/json",
            },
          }
        );
    } finally {
      clearTimeout(
        timeout
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Pincode service is temporarily unavailable.",
        },
        {
          status: 502,
        }
      );
    }

    const data =
      (await response.json()) as PostalApiItem[];

    const firstResult =
      Array.isArray(data)
        ? data[0]
        : null;

    /*
    |--------------------------------------------------------------------------
    | NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (
      !firstResult ||
      firstResult.Status
        ?.toLowerCase() !==
        "success" ||
      !Array.isArray(
        firstResult.PostOffice
      ) ||
      firstResult.PostOffice
        .length === 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "No location found for this pincode.",
        },
        {
          status: 404,
        }
      );
    }

    const postOffices =
      firstResult.PostOffice;

    /*
    |--------------------------------------------------------------------------
    | MAIN LOCATION
    |--------------------------------------------------------------------------
    */

    const firstOffice =
      postOffices[0];

    const state =
      normalizeStateName(
        firstOffice.State ||
          ""
      );

    /*
    |--------------------------------------------------------------------------
    | CITY / DISTRICT
    |--------------------------------------------------------------------------
    |
    | India Post data commonly identifies delivery area using District.
    |--------------------------------------------------------------------------
    */

    const city =
      cleanString(
        firstOffice.District
      ) ||
      cleanString(
        firstOffice.Block
      ) ||
      cleanString(
        firstOffice.Division
      );

    /*
    |--------------------------------------------------------------------------
    | AREAS
    |--------------------------------------------------------------------------
    */

    const areas =
      uniqueStrings([
        ...postOffices.map(
          (office) =>
            office.Name
        ),

        ...postOffices.map(
          (office) =>
            office.Block
        ),
      ]);

    /*
    |--------------------------------------------------------------------------
    | DISTRICTS
    |--------------------------------------------------------------------------
    */

    const cities =
      uniqueStrings(
        postOffices.map(
          (office) =>
            office.District
        )
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        pincode,

        country:
          "India",

        state,

        city,

        cities,

        areas,

        postOffices:
          postOffices.map(
            (office) => ({
              name:
                cleanString(
                  office.Name
                ),

              district:
                cleanString(
                  office.District
                ),

              block:
                cleanString(
                  office.Block
                ),

              division:
                cleanString(
                  office.Division
                ),

              region:
                cleanString(
                  office.Region
                ),

              state:
                normalizeStateName(
                  office.State ||
                    ""
                ),

              pincode:
                cleanString(
                  office.Pincode
                ),

              deliveryStatus:
                cleanString(
                  office.DeliveryStatus
                ),
            })
          ),
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error(
      "PINCODE LOOKUP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to lookup pincode right now. Please select state and city manually.",
      },
      {
        status: 500,
      }
    );
  }
}