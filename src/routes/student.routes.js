const express = require("express");
const NameList = require("../models/namelist");

const router = express.Router();

// Route to get all name lists
router.get("/", async (req, res) => {
  try {
    const namelists = await NameList.find({});
    return res.status(200).json(namelists);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to get all name list titles and their IDs
router.get("/namelists", async (req, res) => {
  try {
    const namelists = await NameList.find({}).select("title _id");
    return res.status(200).json(namelists);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to get students by name list id
router.get("/students", async (req, res) => {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    const namelist = await NameList.findOne({ _id: _id });

    if (!namelist) {
      return res.status(404).json({
        message: "Name list with the specified title not found.",
      });
    }

    return res.status(200).json(namelist.students);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//add a new name list
router.post("/addlist", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    const newUser = {
      title,
    };

    const namelist = await NameList.create(newUser);

    return res.status(201).json(namelist);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//add a new student to a name list
router.put("/addstudent", async (req, res) => {
  try {
    const { _id, rollno, name } = req.body;

    if (!_id || !rollno || !name) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    const details = {
      rollno,
      name,
    };

    const namelist = await NameList.findOne({ _id: _id });

    if (!namelist) {
      return res.status(404).json({
        message: "Student list with the specified title not found.",
      });
    }

    namelist.students.push(details);
    await namelist.save();

    return res.status(200).json(namelist);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to delete a name list by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const namelist = await NameList.findByIdAndDelete(id);

    if (!namelist) {
      return res.status(404).json({ message: "Name list not found." });
    }

    return res.status(200).json({ message: "Name list deleted successfully." });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to delete a student from a name list by title and roll number
router.delete("/student", async (req, res) => {
  try {
    const { _id, rollno } = req.body;

    if (!_id || !rollno) {
      return res
        .status(400)
        .json({ message: "Title and roll number must be provided." });
    }

    const namelist = await NameList.findOne({ _id: _id });

    if (!namelist) {
      return res.status(404).json({ message: "Name list not found." });
    }

    const studentIndex = namelist.students.findIndex(
      (student) => student.rollno === rollno
    );

    if (studentIndex === -1) {
      return res
        .status(404)
        .json({ message: "Student not found in the name list." });
    }

    namelist.students.splice(studentIndex, 1);
    await namelist.save();

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to edit a student's details
router.put("/students", async (req, res) => {
  try {
    const { _id, rollno, newRollno, newName } = req.body;

    if (!_id || !rollno || (!newRollno && !newName)) {
      return res.status(400).json({
        message: "Title, roll number, and new details must be provided.",
      });
    }

    const namelist = await NameList.findOne({ _id: _id });

    if (!namelist) {
      return res.status(404).json({ message: "Name list not found." });
    }

    const student = namelist.students.find(
      (student) => student.rollno === rollno
    );

    if (!student) {
      return res
        .status(404)
        .json({ message: "Student not found in the name list." });
    }

    if (newRollno) student.rollno = newRollno;
    if (newName) student.name = newName;

    await namelist.save();

    return res
      .status(200)
      .json({ message: "Student details updated successfully." });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
