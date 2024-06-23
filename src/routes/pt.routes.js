const express = require("express");

const PtList = require("../models/ptlist");
const NameList = require("../models/namelist");

const router = express.Router();

// sample schema
// {
//   "nameListId": "667512e6f23057d5f66a2c7c",
//   "title": "Your PT List Title",
//   "parts": [
//     {
//       "title": "Part 1",
//       "maxmark": 10,
//       "questions": [
//         { "number": 1, "type": "understand" },
//         { "number": 2, "type": "understand" }
//       ]
//     },
//     {
//       "title": "Part 2",
//       "maxmark": 15,
//       "questions": [
//         { "number": 1, "type": "analyse" },
//         { "number": 2, "type": "understand" }
//       ]
//     },
//     {
//       "title": "Part 3",
//       "maxmark": 5,
//       "questions": [
//         { "number": 1, "type": "understand" },
//         { "number": 2, "type": "analyse" }
//       ]
//     }
//   ]
// }

// Helper function to calculate average mark
const calculateAverageMark = (students) => {
  const totalMarks = students.reduce(
    (sum, student) => sum + student.totalMark,
    0
  );
  return students.length ? totalMarks / students.length : 0;
};

// Route to create a table of students from the NameList with user-defined parts
router.post("/create-ptlist", async (req, res) => {
  try {
    const { nameListId, title, parts } = req.body;

    if (!nameListId || !title || !parts) {
      return res.status(400).send("Missing required fields");
    }

    const nameList = await NameList.findById(nameListId);
    if (!nameList) {
      return res.status(404).send("NameList not found");
    }

    // Initialize mark and typemark for each question
    const initializedParts = parts.map((part) => ({
      ...part,
      questions: part.questions.map((question) => ({
        ...question,
        mark: 0,
      })),
    }));

    const students = nameList.students.map((student) => {
      const typemark = new Map();
      parts.forEach((part) => {
        part.questions.forEach((question) => {
          typemark.set(question.type, 0);
        });
      });

      return {
        rollno: student.rollno,
        name: student.name,
        totalMark: 0,
        typemark: typemark,
        parts: initializedParts,
      };
    });

    const averagemark = calculateAverageMark(students);

    const ptList = new PtList({
      title: title,
      students: students,
      averagemark: averagemark,
    });

    await ptList.save();
    res.status(201).send(ptList);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Route to enter marks for a question
router.post("/enter-mark/:ptListId/:studentId", async (req, res) => {
  try {
    const ptList = await PtList.findById(req.params.ptListId);
    if (!ptList) {
      return res.status(404).send("PtList not found");
    }

    const student = ptList.students.id(req.params.studentId);
    if (!student) {
      return res.status(404).send("Student not found");
    }

    const { partTitle, questionNumber, mark } = req.body;

    if (typeof mark !== "number") {
      return res.status(400).send("Invalid mark value");
    }

    let part = student.parts.find((p) => p.title === partTitle);
    if (!part) {
      return res.status(404).send("Part not found");
    }

    if (mark > part.maxmark) {
      return res.status(400).send("Mark exceeds the maximum mark for the part");
    }

    let question = part.questions.find((q) => q.number === questionNumber);
    if (!question) {
      return res.status(404).send("Question not found");
    }

    const previousMark = question.mark;
    question.mark = mark;

    // Update total mark and type mark
    student.totalMark = student.totalMark - previousMark + mark;
    const questionType = question.type;
    student.typemark.set(
      questionType,
      (student.typemark.get(questionType) || 0) - previousMark + mark
    );

    // Recalculate the average mark for the ptList
    ptList.averagemark = calculateAverageMark(ptList.students);

    await ptList.save();
    res.status(200).send(ptList);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Route to delete a PtList
app.delete("/delete-ptlist/:ptListId", async (req, res) => {
  try {
    const ptList = await PtList.findByIdAndDelete(req.params.ptListId);
    if (!ptList) {
      return res.status(404).send("PtList not found");
    }
    res.status(200).send({ message: "PtList deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
