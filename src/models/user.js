const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    namelist: [
      {
        type: Schema.Types.ObjectId,
        ref: "NameList",
      },
    ],
    ptlists: [
      {
        type: Schema.Types.ObjectId,
        ref: "PtList",
      },
    ],
    saalists: [
      {
        type: Schema.Types.ObjectId,
        ref: "SAA",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
