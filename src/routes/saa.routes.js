const express = require("express");
const NameList = require("../models/namelist");
const SAA = require("../models/saa");
const User = require("../models/user");

const router = express.Router();

// POST route to create a new SAA list of students with marks
router.post("/create-saalist", async (req, res) => {
  try {
    const { title, courses, namelistId, userId } = req.body;

    if (
      !title ||
      !courses ||
      !Array.isArray(courses) ||
      !namelistId ||
      !userId
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const nameList = await NameList.findById(namelistId);

    if (!nameList) {
      return res.status(404).json({ message: "NameList not found" });
    }

    const populatedStudents = nameList.students.map((student) => {
      const scores = {};
      courses.forEach((course) => {
        scores[course] = 0;
      });
      return {
        rollno: student.rollno,
        name: student.name,
        scores,
      };
    });

    const newSAAList = new SAA({
      title,
      courses,
      students: populatedStudents,
    });

    const savedSAAList = await newSAAList.save();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.saalists.push(savedSAAList._id);

    await user.save();

    res.status(201).json({
      message: "SAA list created successfully",
      saaList: savedSAAList,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating SAA list", error: error.message });
  }
});

// PUT route to update the scores of a single student in an SAA list
router.put("/student-score", async (req, res) => {
  try {
    const { saaId, userId, rollno, scores } = req.body;

    if (!saaId || !userId || !rollno || !scores || typeof scores !== "object") {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.saalists.includes(saaId)) {
      return res
        .status(403)
        .json({ message: "User does not have access to this SAA list" });
    }

    const saaList = await SAA.findById(saaId);

    if (!saaList) {
      return res.status(404).json({ message: "SAA list not found" });
    }

    const student = saaList.students.find(
      (student) => student.rollno === rollno
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    for (let course in scores) {
      if (student.scores.has(course)) {
        student.scores.set(course, scores[course]);
      }
    }

    const updatedSAAList = await saaList.save();

    res.status(200).json({
      message: "Student scores updated successfully",
      saaList: updatedSAAList,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating student scores", error: error.message });
  }
});

// DELETE route to delete an SAA list
router.delete("/delete-saa/:saaId/:userId", async (req, res) => {
  try {
    const { saaId, userId } = req.params;

    if (!saaId || !userId) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.saalists.includes(saaId)) {
      return res
        .status(403)
        .json({ message: "User does not have access to delete this SAA list" });
    }

    const saaList = await SAA.findById(saaId);

    if (!saaList) {
      return res.status(404).json({ message: "SAA list not found" });
    }

    await saaList.remove();

    user.saalists = user.saalists.filter(
      (listId) => listId.toString() !== saaId
    );

    await user.save();

    res.status(200).json({ message: "SAA list deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting SAA list", error: error.message });
  }
});

module.exports = router;
