const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  rollno: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const namelistSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    students: [studentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NameList", namelistSchema);
