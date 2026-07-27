import { Schema, model, models } from "mongoose";


const ImportHistorySchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    createdProducts: {
      type: Number,
      default: 0,
    },

    updatedProducts: {
      type: Number,
      default: 0,
    },

    failedProducts: {
      type: Number,
      default: 0,
    },

    errors: {
      type: [String],
      default: [],
    },

    importedBy: {
      type: String,
      default: "Admin",
    },

    status: {
      type: String,
      enum: [
        "success",
        "failed",
        "partial",
      ],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);


const ImportHistory =
  models.ImportHistory ||
  model(
    "ImportHistory",
    ImportHistorySchema
  );


export default ImportHistory;
