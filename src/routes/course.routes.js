// routes/colist.js
const express = require("express");
const COlist = require("../models/colist");
const NameList = require("../models/namelist");

const router = express.Router();

// Route to get all co lists
router.get("/", async (req, res) => {
  try {
    const colists = await COlist.find({});
    return res.status(200).json(colists);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to get all co list titles and their IDs
router.get("/colists", async (req, res) => {
  try {
    const colists = await COlist.find({}).select("title _id");
    return res.status(200).json(colists);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to get students mark by name list id
router.get("/studentsmark", async (req, res) => {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    const colist = await COlist.findOne({ _id: _id });

    if (!colist) {
      return res.status(404).json({
        message: "Name list with the specified title not found.",
      });
    }

    return res.status(200).json(colist.students);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to create a new COlist based on an existing NameList
router.post("/addcolist", async (req, res) => {
  try {
    const { title, namelist_id, rows } = req.body;

    if (!title || !Array.isArray(rows) || !namelist_id) {
      return res.status(400).json({ message: "All fields must be provided." });
    }

    const namelist = await NameList.findById(namelist_id);

    if (!namelist) {
      return res.status(404).json({ message: "NameList not found." });
    }

    const students = namelist.students.map((student) => {
      const scores = new Map();
      rows.forEach((row) => {
        scores.set(row, 0);
      });

      return {
        rollno: student.rollno,
        name: student.name,
        scores,
      };
    });

    const newList = new COlist({
      title,
      rows,
      students,
    });

    await newList.save();

    return res.status(201).json(newList);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add or Update Student Score
router.post("/:id/student/:rollno/scores", async (req, res) => {
  try {
    const { id, rollno } = req.params;
    const { assignment, score } = req.body;
    const course = await COlist.findById(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const student = course.students.find(
      (student) => student.rollno === rollno
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    student.scores.set(assignment, score);
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Course by ID
router.delete("/courses/:id", async (req, res) => {
  try {
    const course = await COlist.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
