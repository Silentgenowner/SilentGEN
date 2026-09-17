"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Address = {
  _id?: string;

  fullName: string;

  mobile: string;

  address: string;

  area: string;

  city: string;

  state: string;

  country: string;

  pincode: string;

  landmark: string;

  isDefault?: boolean;
};

type UserProfile = {
  name?: string;

  mobile?: string;

  email?: string;
};

type ProfileApiResponse = {
  success?: boolean;

  user?: UserProfile;

  profile?: UserProfile;

  data?: UserProfile;

  message?: string;
};

type PincodeApiResponse = {
  success?: boolean;

  message?: string;

  pincode?: string;

  country?: string;

  state?: string;

  city?: string;

  cities?: string[];

  areas?: string[];
};

/*
|--------------------------------------------------------------------------
| INDIA STATES + CITIES
|--------------------------------------------------------------------------
|
| This remains as manual fallback.
|
|--------------------------------------------------------------------------
*/

const INDIA_STATE_CITY_MAP: Record<
  string,
  string[]
> = {
  "Andaman and Nicobar Islands": [
    "Port Blair",
    "Diglipur",
    "Mayabunder",
    "Rangat",
    "Car Nicobar",
    "Campbell Bay",
  ],

  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Tirupati",
    "Kurnool",
    "Rajahmundry",
    "Kakinada",
    "Kadapa",
    "Anantapur",
    "Eluru",
    "Ongole",
    "Chittoor",
    "Machilipatnam",
    "Srikakulam",
    "Vizianagaram",
    "Tenali",
    "Bhimavaram",
    "Proddatur",
    "Nandyal",
  ],

  "Arunachal Pradesh": [
    "Itanagar",
    "Naharlagun",
    "Pasighat",
    "Tawang",
    "Ziro",
    "Bomdila",
    "Tezu",
    "Roing",
    "Along",
    "Namsai",
  ],

  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Tezpur",
    "Bongaigaon",
    "Diphu",
    "North Lakhimpur",
    "Sivasagar",
    "Goalpara",
    "Karimganj",
    "Hailakandi",
  ],

  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
    "Purnia",
    "Arrah",
    "Begusarai",
    "Katihar",
    "Munger",
    "Chhapra",
    "Bihar Sharif",
    "Hajipur",
    "Sasaram",
    "Siwan",
    "Motihari",
    "Samastipur",
    "Sitamarhi",
    "Madhubani",
  ],

  Chandigarh: [
    "Chandigarh",
  ],

  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Durg",
    "Bilaspur",
    "Korba",
    "Rajnandgaon",
    "Raigarh",
    "Jagdalpur",
    "Ambikapur",
    "Dhamtari",
    "Mahasamund",
    "Kanker",
  ],

  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman",
    "Diu",
    "Silvassa",
  ],

  Delhi: [
    "New Delhi",
    "Delhi",
    "Dwarka",
    "Rohini",
    "Saket",
    "Janakpuri",
    "Karol Bagh",
    "Shahdara",
    "Pitampura",
    "Laxmi Nagar",
  ],

  Goa: [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Mapusa",
    "Ponda",
    "Bicholim",
    "Curchorem",
    "Canacona",
  ],

  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Gandhinagar",
    "Anand",
    "Nadiad",
    "Mehsana",
    "Morbi",
    "Bharuch",
    "Vapi",
    "Navsari",
    "Valsad",
    "Palanpur",
    "Porbandar",
    "Godhra",
    "Dahod",
    "Botad",
    "Amreli",
    "Patan",
    "Surendranagar",
    "Bhuj",
    "Gandhidham",
    "Veraval",
    "Ankleshwar",
    "Jetpur",
    "Kalol",
    "Himmatnagar",
  ],

  Haryana: [
    "Gurugram",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
    "Bhiwani",
    "Sirsa",
    "Bahadurgarh",
    "Rewari",
    "Kaithal",
    "Jind",
    "Palwal",
    "Kurukshetra",
  ],

  "Himachal Pradesh": [
    "Shimla",
    "Dharamshala",
    "Mandi",
    "Solan",
    "Kullu",
    "Hamirpur",
    "Una",
    "Bilaspur",
    "Chamba",
    "Nahan",
    "Manali",
    "Palampur",
  ],

  "Jammu and Kashmir": [
    "Srinagar",
    "Jammu",
    "Anantnag",
    "Baramulla",
    "Kathua",
    "Udhampur",
    "Sopore",
    "Pulwama",
    "Rajouri",
    "Poonch",
  ],

  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Hazaribagh",
    "Giridih",
    "Ramgarh",
    "Medininagar",
    "Chaibasa",
    "Dumka",
  ],

  Karnataka: [
    "Bengaluru",
    "Mysuru",
    "Mangaluru",
    "Hubballi",
    "Dharwad",
    "Belagavi",
    "Kalaburagi",
    "Davanagere",
    "Ballari",
    "Shivamogga",
    "Tumakuru",
    "Vijayapura",
    "Udupi",
    "Raichur",
    "Hassan",
    "Bidar",
    "Mandya",
    "Chitradurga",
    "Kolar",
  ],

  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Kannur",
    "Alappuzha",
    "Kottayam",
    "Palakkad",
    "Malappuram",
    "Kasaragod",
    "Pathanamthitta",
    "Idukki",
    "Wayanad",
  ],

  Ladakh: [
    "Leh",
    "Kargil",
  ],

  Lakshadweep: [
    "Kavaratti",
    "Agatti",
    "Amini",
    "Andrott",
    "Minicoy",
  ],

  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
    "Katni",
    "Singrauli",
    "Burhanpur",
    "Khandwa",
    "Morena",
    "Bhind",
    "Chhindwara",
    "Vidisha",
  ],

  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Navi Mumbai",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
    "Sangli",
    "Jalgaon",
    "Akola",
    "Latur",
    "Ahmednagar",
    "Dhule",
    "Chandrapur",
    "Satara",
    "Ratnagiri",
    "Wardha",
    "Yavatmal",
  ],

  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
    "Churachandpur",
    "Ukhrul",
    "Senapati",
    "Kakching",
  ],

  Meghalaya: [
    "Shillong",
    "Tura",
    "Jowai",
    "Nongpoh",
    "Williamnagar",
    "Baghmara",
  ],

  Mizoram: [
    "Aizawl",
    "Lunglei",
    "Champhai",
    "Serchhip",
    "Kolasib",
    "Saiha",
  ],

  Nagaland: [
    "Kohima",
    "Dimapur",
    "Mokokchung",
    "Tuensang",
    "Wokha",
    "Mon",
    "Zunheboto",
  ],

  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Bhadrak",
    "Baripada",
    "Jharsuguda",
    "Jeypore",
    "Angul",
  ],

  Puducherry: [
    "Puducherry",
    "Karaikal",
    "Mahe",
    "Yanam",
  ],

  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Pathankot",
    "Hoshiarpur",
    "Moga",
    "Firozpur",
    "Sangrur",
    "Barnala",
    "Kapurthala",
    "Abohar",
  ],

  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Udaipur",
    "Ajmer",
    "Bikaner",
    "Alwar",
    "Bhilwara",
    "Sikar",
    "Sri Ganganagar",
    "Pali",
    "Bharatpur",
    "Hanumangarh",
    "Chittorgarh",
    "Tonk",
    "Kishangarh",
    "Jaisalmer",
    "Barmer",
  ],

  Sikkim: [
    "Gangtok",
    "Namchi",
    "Gyalshing",
    "Mangan",
    "Rangpo",
  ],

  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tiruppur",
    "Erode",
    "Vellore",
    "Thoothukudi",
    "Dindigul",
    "Thanjavur",
    "Tirunelveli",
    "Nagercoil",
    "Kanchipuram",
    "Hosur",
    "Karur",
    "Cuddalore",
  ],

  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Ramagundam",
    "Mahbubnagar",
    "Nalgonda",
    "Adilabad",
    "Suryapet",
    "Siddipet",
  ],

  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
    "Kailasahar",
    "Belonia",
    "Ambassa",
  ],

  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Meerut",
    "Prayagraj",
    "Noida",
    "Greater Noida",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Mathura",
    "Firozabad",
    "Jhansi",
    "Ayodhya",
    "Muzaffarnagar",
    "Rampur",
    "Shahjahanpur",
    "Hapur",
  ],

  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Haldwani",
    "Roorkee",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
    "Nainital",
    "Almora",
    "Pithoragarh",
  ],

  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
    "Bardhaman",
    "Malda",
    "Kharagpur",
    "Haldia",
    "Darjeeling",
    "Jalpaiguri",
    "Krishnanagar",
    "Berhampore",
    "Raiganj",
  ],
};

/*
|--------------------------------------------------------------------------
| STATE LIST
|--------------------------------------------------------------------------
*/

const INDIA_STATES =
  Object.keys(
    INDIA_STATE_CITY_MAP
  ).sort((a, b) =>
    a.localeCompare(b)
  );

/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const emptyForm: Address = {
  fullName: "",

  mobile: "",

  address: "",

  area: "",

  city: "",

  state: "",

  country: "India",

  pincode: "",

  landmark: "",
};

/*
|--------------------------------------------------------------------------
| UNIQUE STRINGS
|--------------------------------------------------------------------------
*/

function uniqueStrings(
  values: string[]
): string[] {
  const map =
    new Map<
      string,
      string
    >();

  for (const value of values) {
    const cleaned =
      value?.trim();

    if (!cleaned) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (!map.has(key)) {
      map.set(
        key,
        cleaned
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
| PAGE
|--------------------------------------------------------------------------
*/

export default function AddressPage() {
  const [
    addresses,
    setAddresses,
  ] =
    useState<Address[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editId,
    setEditId,
  ] =
    useState<
      string | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<Address>(
      emptyForm
    );

  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>({
      name: "",

      mobile: "",

      email: "",
    });

  /*
  |--------------------------------------------------------------------------
  | PINCODE LOOKUP STATE
  |--------------------------------------------------------------------------
  */

  const [
    pincodeLoading,
    setPincodeLoading,
  ] =
    useState(false);

  const [
    pincodeMessage,
    setPincodeMessage,
  ] =
    useState("");

  const [
    pincodeSuccess,
    setPincodeSuccess,
  ] =
    useState(false);

  const [
    pincodeAreas,
    setPincodeAreas,
  ] =
    useState<string[]>([]);

  const [
    pincodeCities,
    setPincodeCities,
  ] =
    useState<string[]>([]);

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE CITIES
  |--------------------------------------------------------------------------
  */

  const availableCities =
    useMemo(() => {
      if (!form.state) {
        return [];
      }

      const staticCities =
        INDIA_STATE_CITY_MAP[
          form.state
        ] || [];

      return uniqueStrings([
        ...staticCities,

        ...pincodeCities,

        form.city,
      ]);
    }, [
      form.state,
      form.city,
      pincodeCities,
    ]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadInitialData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD INITIAL DATA
  |--------------------------------------------------------------------------
  */

  async function loadInitialData() {
    try {
      setLoading(true);

      await Promise.all([
        fetchAddresses(),

        fetchProfile(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH PROFILE
  |--------------------------------------------------------------------------
  */

  async function fetchProfile() {
    try {
      const response =
        await fetch(
          "/api/user/profile",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data:
        ProfileApiResponse =
          await response.json();

      if (!response.ok) {
        console.error(
          "PROFILE FETCH ERROR:",
          data?.message
        );

        return;
      }

      const user =
        data?.user ||
        data?.profile ||
        data?.data ||
        {};

      const nextProfile = {
        name:
          typeof user?.name ===
          "string"
            ? user.name.trim()
            : "",

        mobile:
          typeof user?.mobile ===
          "string"
            ? user.mobile.trim()
            : "",

        email:
          typeof user?.email ===
          "string"
            ? user.email.trim()
            : "",
      };

      setProfile(
        nextProfile
      );

      setForm(
        (previous) => ({
          ...previous,

          fullName:
            previous.fullName ||
            nextProfile.name ||
            "",

          mobile:
            previous.mobile ||
            nextProfile.mobile ||
            "",
        })
      );
    } catch (error) {
      console.error(
        "PROFILE FETCH ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FETCH ADDRESSES
  |--------------------------------------------------------------------------
  */

  async function fetchAddresses() {
    try {
      const response =
        await fetch(
          "/api/address",
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        setAddresses(
          Array.isArray(
            data.addresses
          )
            ? data.addresses
            : []
        );
      }
    } catch (error) {
      console.error(
        "ADDRESS FETCH ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NEW ADDRESS FORM
  |--------------------------------------------------------------------------
  */

  function createNewAddressForm(): Address {
    return {
      ...emptyForm,

      fullName:
        profile.name ||
        "",

      mobile:
        profile.mobile ||
        "",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | RESET PINCODE DATA
  |--------------------------------------------------------------------------
  */

  function resetPincodeData() {
    setPincodeAreas([]);

    setPincodeCities([]);

    setPincodeMessage("");

    setPincodeSuccess(
      false
    );

    setPincodeLoading(
      false
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ADD ADDRESS
  |--------------------------------------------------------------------------
  */

  function handleAddAddress() {
    if (
      showForm &&
      !editId
    ) {
      setShowForm(false);

      return;
    }

    setEditId(null);

    resetPincodeData();

    setForm(
      createNewAddressForm()
    );

    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | EDIT ADDRESS
  |--------------------------------------------------------------------------
  */

  function handleEdit(
    item: Address
  ) {
    setEditId(
      item._id || null
    );

    resetPincodeData();

    setForm({
      fullName:
        item.fullName || "",

      mobile:
        item.mobile || "",

      address:
        item.address || "",

      area:
        item.area || "",

      city:
        item.city || "",

      state:
        item.state || "",

      country:
        item.country ||
        "India",

      pincode:
        item.pincode || "",

      landmark:
        item.landmark || "",
    });

    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  function cancelForm() {
    setEditId(null);

    resetPincodeData();

    setForm(
      createNewAddressForm()
    );

    setShowForm(false);
  }

  /*
  |--------------------------------------------------------------------------
  | STATE CHANGE
  |--------------------------------------------------------------------------
  */

  function handleStateChange(
    state: string
  ) {
    setPincodeCities([]);

    setPincodeAreas([]);

    setPincodeMessage("");

    setPincodeSuccess(
      false
    );

    setForm(
      (previous) => ({
        ...previous,

        state,

        city: "",
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PINCODE LOOKUP
  |--------------------------------------------------------------------------
  */

  async function lookupPincode(
    pincode: string
  ) {
    if (
      !/^\d{6}$/.test(
        pincode
      )
    ) {
      return;
    }

    try {
      setPincodeLoading(
        true
      );

      setPincodeMessage(
        "Checking pincode..."
      );

      setPincodeSuccess(
        false
      );

      setPincodeAreas([]);

      setPincodeCities([]);

      const response =
        await fetch(
          `/api/pincode/${pincode}`,
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      const data:
        PincodeApiResponse =
          await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setPincodeMessage(
          data.message ||
            "Pincode not found. Please select state and city manually."
        );

        return;
      }

      const state =
        typeof data.state ===
        "string"
          ? data.state.trim()
          : "";

      const city =
        typeof data.city ===
        "string"
          ? data.city.trim()
          : "";

      const areas =
        Array.isArray(
          data.areas
        )
          ? uniqueStrings(
              data.areas
            )
          : [];

      const cities =
        Array.isArray(
          data.cities
        )
          ? uniqueStrings([
              ...data.cities,

              city,
            ])
          : city
            ? [city]
            : [];

      setPincodeAreas(
        areas
      );

      setPincodeCities(
        cities
      );

      setForm(
        (previous) => ({
          ...previous,

          pincode,

          state:
            state ||
            previous.state,

          city:
            city ||
            previous.city,

          country:
            "India",
        })
      );

      setPincodeSuccess(
        true
      );

      setPincodeMessage(
        state && city
          ? `Location found: ${city}, ${state}`
          : "Pincode verified successfully."
      );
    } catch (error) {
      console.error(
        "PINCODE LOOKUP ERROR:",
        error
      );

      setPincodeSuccess(
        false
      );

      setPincodeMessage(
        "Pincode lookup unavailable. Please select state and city manually."
      );
    } finally {
      setPincodeLoading(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PINCODE CHANGE
  |--------------------------------------------------------------------------
  */

  function handlePincodeChange(
    value: string
  ) {
    const cleaned =
      value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    setForm(
      (previous) => ({
        ...previous,

        pincode:
          cleaned,
      })
    );

    /*
    |--------------------------------------------------------------------------
    | RESET OLD RESULT
    |--------------------------------------------------------------------------
    */

    if (
      cleaned.length <
      6
    ) {
      setPincodeAreas([]);

      setPincodeCities([]);

      setPincodeMessage("");

      setPincodeSuccess(
        false
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO LOOKUP ON 6 DIGITS
    |--------------------------------------------------------------------------
    */

    void lookupPincode(
      cleaned
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE ADDRESS
  |--------------------------------------------------------------------------
  */

  async function saveAddress() {
    if (
      !form.fullName.trim() ||
      !form.mobile.trim() ||
      !form.address.trim() ||
      !form.area.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      alert(
        "Please fill all required fields."
      );

      return;
    }

    if (
      !/^\d{10}$/.test(
        form.mobile
          .replace(
            /\D/g,
            ""
          )
      )
    ) {
      alert(
        "Please enter a valid 10 digit mobile number."
      );

      return;
    }

    if (
      !/^\d{6}$/.test(
        form.pincode
      )
    ) {
      alert(
        "Please enter a valid 6 digit pincode."
      );

      return;
    }

    const url =
      editId
        ? `/api/address/${editId}`
        : "/api/address";

    const method =
      editId
        ? "PUT"
        : "POST";

    try {
      const response =
        await fetch(
          url,
          {
            method,

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                fullName:
                  form.fullName.trim(),

                mobile:
                  form.mobile
                    .replace(
                      /\D/g,
                      ""
                    )
                    .trim(),

                address:
                  form.address.trim(),

                area:
                  form.area.trim(),

                city:
                  form.city.trim(),

                state:
                  form.state.trim(),

                country:
                  "India",

                pincode:
                  form.pincode.trim(),

                landmark:
                  form.landmark.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        setEditId(null);

        setShowForm(false);

        resetPincodeData();

        setForm(
          createNewAddressForm()
        );

        await fetchAddresses();

        return;
      }

      alert(
        data?.message ||
          "Unable to save address."
      );
    } catch (error) {
      console.error(
        "SAVE ADDRESS ERROR:",
        error
      );

      alert(
        "Unable to save address."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE ADDRESS
  |--------------------------------------------------------------------------
  */

  async function deleteAddress(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this address?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/address/${id}`,
          {
            method:
              "DELETE",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        await fetchAddresses();

        return;
      }

      alert(
        data?.message ||
          "Unable to delete address."
      );
    } catch (error) {
      console.error(
        "DELETE ADDRESS ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SET DEFAULT
  |--------------------------------------------------------------------------
  */

  async function setDefaultAddress(
    id: string
  ) {
    try {
      const response =
        await fetch(
          `/api/address/default/${id}`,
          {
            method:
              "PUT",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.success
      ) {
        await fetchAddresses();

        return;
      }

      alert(
        data?.message ||
          "Unable to set default address."
      );
    } catch (error) {
      console.error(
        "SET DEFAULT ADDRESS ERROR:",
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="p-10">
        Loading Addresses...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div>
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          mb-8
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <h1 className="text-3xl font-bold">
          My Addresses
        </h1>

        <button
          type="button"
          onClick={
            handleAddAddress
          }
          className="
            rounded-lg
            bg-black
            px-5
            py-3
            text-white
            transition
            hover:bg-gray-800
          "
        >
          {showForm &&
          !editId
            ? "Close"
            : "+ Add Address"}
        </button>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | FORM
      |--------------------------------------------------------------------------
      */}

      {showForm && (
        <div
          className="
            mb-8
            space-y-5
            rounded-2xl
            border
            bg-white
            p-6
            shadow-sm
          "
        >
          {/*
          |--------------------------------------------------------------------------
          | FULL NAME + MOBILE
          |--------------------------------------------------------------------------
          */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Full Name *
              </label>

              <input
                value={
                  form.fullName
                }
                onChange={(event) =>
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      fullName:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Full Name"
                className="
                  w-full
                  rounded-lg
                  border
                  p-3
                  outline-none
                  transition
                  focus:border-black
                "
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Mobile Number *
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={
                  form.mobile
                }
                onChange={(event) => {
                  const value =
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        10
                      );

                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      mobile:
                        value,
                    })
                  );
                }}
                placeholder="10 Digit Mobile Number"
                className="
                  w-full
                  rounded-lg
                  border
                  p-3
                  outline-none
                  transition
                  focus:border-black
                "
              />
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | ADDRESS
          |--------------------------------------------------------------------------
          */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              House / Flat / Building / Street *
            </label>

            <input
              value={
                form.address
              }
              onChange={(event) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    address:
                      event.target
                        .value,
                  })
                )
              }
              placeholder="House No., Flat, Building, Street"
              className="
                w-full
                rounded-lg
                border
                p-3
                outline-none
                transition
                focus:border-black
              "
            />
          </div>

          {/*
          |--------------------------------------------------------------------------
          | PINCODE
          |--------------------------------------------------------------------------
          */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Pincode *
            </label>

            <div className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                value={
                  form.pincode
                }
                onChange={(event) =>
                  handlePincodeChange(
                    event.target
                      .value
                  )
                }
                placeholder="6 Digit Pincode"
                className="
                  min-w-0
                  flex-1
                  rounded-lg
                  border
                  p-3
                  outline-none
                  transition
                  focus:border-black
                "
              />

              <button
                type="button"
                disabled={
                  form.pincode
                    .length !==
                    6 ||
                  pincodeLoading
                }
                onClick={() =>
                  void lookupPincode(
                    form.pincode
                  )
                }
                className="
                  shrink-0
                  rounded-lg
                  border
                  border-black
                  px-4
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-black
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:border-gray-200
                  disabled:bg-gray-100
                  disabled:text-gray-400
                "
              >
                {pincodeLoading
                  ? "Checking..."
                  : "Check"}
              </button>
            </div>

            {pincodeMessage && (
              <p
                className={`
                  mt-2
                  text-xs
                  font-medium

                  ${
                    pincodeSuccess
                      ? "text-green-600"
                      : "text-orange-600"
                  }
                `}
              >
                {
                  pincodeMessage
                }
              </p>
            )}

            <p className="mt-1 text-[11px] text-gray-400">
              State and city
              will be filled
              automatically when
              the pincode is
              available.
            </p>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | STATE + CITY
          |--------------------------------------------------------------------------
          */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                State *
              </label>

              <select
                value={
                  form.state
                }
                onChange={(event) =>
                  handleStateChange(
                    event.target
                      .value
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  bg-white
                  p-3
                  outline-none
                  transition
                  focus:border-black
                "
              >
                <option value="">
                  Select State
                </option>

                {/*
                |--------------------------------------------------------------------------
                | Keep auto fetched state even if not present in static list
                |--------------------------------------------------------------------------
                */}

                {form.state &&
                  !INDIA_STATES.includes(
                    form.state
                  ) && (
                    <option
                      value={
                        form.state
                      }
                    >
                      {
                        form.state
                      }
                    </option>
                  )}

                {INDIA_STATES.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                City / District *
              </label>

              <select
                value={
                  form.city
                }
                disabled={
                  !form.state
                }
                onChange={(event) =>
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      city:
                        event.target
                          .value,
                    })
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  bg-white
                  p-3
                  outline-none
                  transition
                  focus:border-black
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                  disabled:text-gray-400
                "
              >
                <option value="">
                  {form.state
                    ? "Select City / District"
                    : "Select State First"}
                </option>

                {availableCities.map(
                  (city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | AREA / SUB CITY
          |--------------------------------------------------------------------------
          */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Area / Sub City / Locality *
            </label>

            <input
              list="address-area-suggestions"
              value={
                form.area
              }
              onChange={(event) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    area:
                      event.target
                        .value,
                  })
                )
              }
              placeholder="Area / Sub City / Locality"
              className="
                w-full
                rounded-lg
                border
                p-3
                outline-none
                transition
                focus:border-black
              "
            />

            <datalist id="address-area-suggestions">
              {pincodeAreas.map(
                (area) => (
                  <option
                    key={area}
                    value={area}
                  />
                )
              )}
            </datalist>

            {pincodeAreas.length >
              0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Suggested
                  areas for this
                  pincode:
                </p>

                <div className="flex flex-wrap gap-2">
                  {pincodeAreas
                    .slice(
                      0,
                      8
                    )
                    .map(
                      (
                        area
                      ) => (
                        <button
                          key={
                            area
                          }
                          type="button"
                          onClick={() =>
                            setForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                area,
                              })
                            )
                          }
                          className="
                            rounded-full
                            border
                            bg-gray-50
                            px-3
                            py-1.5
                            text-xs
                            text-gray-700
                            transition
                            hover:border-black
                            hover:bg-black
                            hover:text-white
                          "
                        >
                          {area}
                        </button>
                      )
                    )}
                </div>
              </div>
            )}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | COUNTRY
          |--------------------------------------------------------------------------
          */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Country
            </label>

            <input
              value="India"
              readOnly
              className="
                w-full
                cursor-not-allowed
                rounded-lg
                border
                bg-gray-100
                p-3
                text-gray-600
                outline-none
              "
            />
          </div>

          {/*
          |--------------------------------------------------------------------------
          | LANDMARK
          |--------------------------------------------------------------------------
          */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Landmark
            </label>

            <input
              value={
                form.landmark
              }
              onChange={(event) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    landmark:
                      event.target
                        .value,
                  })
                )
              }
              placeholder="Nearby Landmark (Optional)"
              className="
                w-full
                rounded-lg
                border
                p-3
                outline-none
                transition
                focus:border-black
              "
            />
          </div>

          {/*
          |--------------------------------------------------------------------------
          | ACTIONS
          |--------------------------------------------------------------------------
          */}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={
                saveAddress
              }
              className="
                rounded-lg
                bg-black
                px-6
                py-3
                font-medium
                text-white
                transition
                hover:bg-gray-800
              "
            >
              {editId
                ? "Update Address"
                : "Save Address"}
            </button>

            <button
              type="button"
              onClick={
                cancelForm
              }
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                px-6
                py-3
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | EMPTY
      |--------------------------------------------------------------------------
      */}

      {addresses.length ===
      0 ? (
        <div
          className="
            rounded-xl
            border
            p-10
            text-center
          "
        >
          No Address Found
        </div>
      ) : (
        /*
        |--------------------------------------------------------------------------
        | ADDRESS LIST
        |--------------------------------------------------------------------------
        */

        <div className="space-y-5">
          {addresses.map(
            (item) => (
              <div
                key={
                  item._id
                }
                className="
                  rounded-xl
                  border
                  bg-white
                  p-5
                "
              >
                {item.isDefault && (
                  <span
                    className="
                      rounded
                      bg-black
                      px-3
                      py-1
                      text-sm
                      text-white
                    "
                  >
                    Default
                  </span>
                )}

                <h2 className="mt-3 text-xl font-bold">
                  {
                    item.fullName
                  }
                </h2>

                <p className="mt-1">
                  +91{" "}
                  {
                    item.mobile
                  }
                </p>

                <p className="mt-3">
                  {
                    item.address
                  }
                </p>

                {item.area && (
                  <p>
                    {
                      item.area
                    }
                  </p>
                )}

                <p>
                  {item.city},{" "}
                  {item.state}
                </p>

                <p>
                  {item.country} -{" "}
                  {item.pincode}
                </p>

                {item.landmark && (
                  <p className="mt-1 text-sm text-gray-600">
                    Landmark:{" "}
                    {
                      item.landmark
                    }
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-5">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        item
                      )
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteAddress(
                        item._id!
                      )
                    }
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>

                  {!item.isDefault && (
                    <button
                      type="button"
                      onClick={() =>
                        setDefaultAddress(
                          item._id!
                        )
                      }
                      className="text-green-600 hover:underline"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}