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
  averageScore: {
    type: Number,
    default: 0,
  },
  scores: {
    type: Map,
    of: Number,
    default: {},
  },
});

// Pre-save middleware to calculate averageScore before saving
studentSchema.pre("save", function (next) {
  if (this.scores.size > 0) {
    const scoreValues = Array.from(this.scores.values());
    const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
    this.averageScore = totalScore / scoreValues.length;
  } else {
    this.averageScore = 0;
  }
  next();
});

// Define the schema for the course list
const colistSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    average: {
      type: Number,
      default: 0,
    },
    rows: {
      type: [String],
      required: true,
    },
    students: [studentSchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate average of students' averageScores before saving
colistSchema.pre("save", function (next) {
  if (this.students.length > 0) {
    const totalAverageScore = this.students.reduce(
      (sum, student) => sum + student.averageScore,
      0
    );
    this.average = totalAverageScore / this.students.length;
  } else {
    this.average = 0;
  }
  next();
});

module.exports = mongoose.model("COlist", colistSchema);
