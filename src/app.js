const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const CourseRoutes = require("./routes/course.routes");
const PtRoutes = require("./routes/pt.routes");
const SaaRoutes = require("./routes/saa.routes");
const StudentRoutes = require("./routes/student.routes");
const UserRoutes = require("./routes/user.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/course", CourseRoutes);
app.use("/pt", PtRoutes);
app.use("/saa", SaaRoutes);
app.use("/student", StudentRoutes);
app.use("/user", UserRoutes);

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3000;
const CONNECTION = process.env.CONNECTION;

if (!CONNECTION) {
  console.error("Connection string is not provided.");
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("Welcome to the CO-attainment API");
});

const start = async () => {
  try {
    await mongoose.connect(CONNECTION);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during startup:", error);
    process.exit(1);
  }

  process.on("SIGINT", () => {
    mongoose.connection.close(() => {
      console.log("MongoDB disconnected through app termination");
      process.exit(0);
    });
  });
};

start();
