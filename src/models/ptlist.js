const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for individual questions
const questionSchema = new Schema({
  number: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  mark: {
    type: Number,
    default: 0,
  },
});

// Define the schema for individual parts
const partSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  maxmark: {
    type: Number,
    required: true,
  },
  questions: [questionSchema],
});

const studentSchema = new Schema({
  rollno: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  totalMark: {
    type: Number,
    default: 0,
  },
  typemark: {
    type: Map,
    of: Number,
    default: {},
  },
  parts: [partSchema],
});

// Define the schema for the course list (PtList)
const ptListSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    averagemark: {
      type: Number,
      default: 0,
    },
    students: [studentSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PtList", ptListSchema);
