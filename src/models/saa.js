const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for individual student's dynamic scores
const studentSchema = new Schema({
  rollno: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  scores: {
    type: Map,
    of: Number,
    default: {},
  },
});

const saaSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    courses: {
      type: [String],
    },
    students: {
      type: [studentSchema],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SAA", saaSchema);
