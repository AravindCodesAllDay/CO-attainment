const express = require("express");
const COlist = require("../models/colist");
const NameList = require("../models/namelist");
const User = require("../models/user");

const router = express.Router();

// Helper function to verify user ownership of COlist
const verifyUserOwnership = async (userId, coId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.courselists.includes(coId)) {
    throw new Error("User does not have access to this CO list");
  }
};

// GET route to retrieve all COlist titles and IDs for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send("Invalid user ID");
    }

    const user = await User.findById(userId).populate(
      "courselists",
      "title _id"
    );

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.status(200).json(user.courselists);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// GET route to retrieve student details for a specific COlist
router.get("/colist/:coId/:userId", async (req, res) => {
  try {
    const { userId, coId } = req.params;

    if (!userId || !coId) {
      return res.status(400).send("Invalid user ID or COlist ID");
    }

    await verifyUserOwnership(userId, coId);

    const coList = await COlist.findById(coId);

    if (!coList) {
      return res.status(404).send("COlist not found");
    }

    res.status(200).json(coList);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Route to create a new COlist based on an existing NameList
router.post("/create/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, namelist_id, rows } = req.body;

    if (!title || !Array.isArray(rows) || !namelist_id || !userId) {
      return res.status(400).json({ message: "All fields must be provided." });
    }

    const namelist = await NameList.findById(namelist_id);

    if (!namelist) {
      return res.status(404).json({ message: "NameList not found." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    user.courselists.push(newList._id);
    await user.save();

    return res.status(201).json(newList);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add or Update Student Score
router.put("/score/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { assignment, score, coId, rollno } = req.body;

    if (!coId || !userId || !assignment || score === undefined) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    await verifyUserOwnership(userId, coId);

    const coList = await COlist.findById(coId);
    if (!coList) {
      return res.status(404).json({ error: "COlist not found" });
    }

    const student = coList.students.find(
      (student) => student.rollno === rollno
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    student.scores.set(assignment, score);
    await coList.save();
    res.status(200).json(coList);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete COlist by ID
router.delete("/delete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { coId } = req.body;

    if (!coId || !userId) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    await verifyUserOwnership(userId, coId);

    const coList = await COlist.findByIdAndDelete(coId);

    if (!coList) {
      return res.status(404).json({ message: "COlist not found" });
    }

    const user = await User.findById(userId);
    user.courselists = user.courselists.filter(
      (listId) => listId.toString() !== coId
    );
    await user.save();

    res.status(200).json({ message: "COlist deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
