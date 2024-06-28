const express = require("express");
const mongoose = require("mongoose");
const NameList = require("../models/namelist");
const SAA = require("../models/saa");
const User = require("../models/user");

const router = express.Router();

const handleErrorResponse = (res, status, message) => {
  return res.status(status).json({ message });
};

const verifyUserOwnership = async (userId, listId, listType) => {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(listId)
  ) {
    throw new Error("Invalid user ID or list ID.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  if (!user[listType].includes(listId)) {
    throw new Error("List not associated with the user.");
  }
};

// GET route to retrieve all SAA list titles and IDs for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return handleErrorResponse(res, 400, "Invalid user ID");
    }

    const user = await User.findById(userId).populate("saalists", "title _id");

    if (!user) {
      return handleErrorResponse(res, 404, "User not found");
    }

    const saalists = user.saalists;
    res.status(200).json(saalists);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving SAA lists", error: error.message });
  }
});

// GET route to retrieve student details for a specific SAA list
router.get("/saalist/:saaId/:userId", async (req, res) => {
  try {
    const { userId, saaId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(saaId)
    ) {
      return handleErrorResponse(res, 400, "Invalid user ID or SAA list ID");
    }

    await verifyUserOwnership(userId, saaId, "saalists");

    const saaList = await SAA.findById(saaId);

    if (!saaList) {
      return handleErrorResponse(res, 404, "SAA list not found");
    }

    res.status(200).json(saaList);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving student details",
      error: error.message,
    });
  }
});

router.post("/create/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, courses, namelistId } = req.body;

    if (
      !title ||
      !courses ||
      !Array.isArray(courses) ||
      !namelistId ||
      !userId
    ) {
      return handleErrorResponse(res, 400, "Invalid input data");
    }

    await verifyUserOwnership(userId, namelistId, "namelists");

    const nameList = await NameList.findById(namelistId);
    if (!nameList) {
      return handleErrorResponse(res, 404, "NameList not found");
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

    const user = await User.findById(userId);
    if (!user) {
      return handleErrorResponse(res, 404, "User not found");
    }

    const savedSAAList = await newSAAList.save();
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

router.put("/score/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { saaId, rollno, scores } = req.body;

    if (!saaId || !userId || !rollno || !scores || typeof scores !== "object") {
      return handleErrorResponse(res, 400, "Invalid input data");
    }

    await verifyUserOwnership(userId, saaId, "saalists");

    const saaList = await SAA.findById(saaId);
    if (!saaList) {
      return handleErrorResponse(res, 404, "SAA list not found");
    }

    const student = saaList.students.find(
      (student) => student.rollno === rollno
    );
    if (!student) {
      return handleErrorResponse(res, 404, "Student not found");
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

router.delete("/delete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { saaId } = req.body;

    if (!saaId || !userId) {
      return handleErrorResponse(res, 400, "Invalid input data");
    }

    await verifyUserOwnership(userId, saaId, "saalists");

    const saaList = await SAA.findById(saaId);
    if (!saaList) {
      return handleErrorResponse(res, 404, "SAA list not found");
    }

    await saaList.remove();

    const user = await User.findById(userId);
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
