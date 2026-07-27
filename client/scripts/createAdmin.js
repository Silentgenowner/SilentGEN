const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config({
  path: ".env.local",
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing");
}


const UserSchema = new mongoose.Schema(
  {
    name: String,

    mobile: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
    },

    password: String,

    role: {
      type: String,
      default: "user",
    },
  }
);


const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);


async function createAdmin() {

  try {

    await mongoose.connect(
      MONGODB_URI,
      {
        dbName: "SilentGEN",
      }
    );


    const existingAdmin =
      await User.findOne({
        email: "admin@silentgen.com",
      });


    if (existingAdmin) {

      console.log(
        "Admin already exists"
      );

      process.exit();

    }


    const hashedPassword =
      await bcrypt.hash(
        "Admin@123",
        10
      );


    await User.create({

      name: "SilentGEN Admin",

      mobile: "9999999999",

      email:
        "admin@silentgen.com",

      password:
        hashedPassword,

      role:
        "admin",

    });


    console.log(
      "Admin Created Successfully"
    );


    process.exit();


  } catch (error) {

    console.log(
      "CREATE ADMIN ERROR:",
      error
    );

    process.exit(1);

  }

}


createAdmin();
