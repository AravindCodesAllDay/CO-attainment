const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// POST route for user login or creation
router.post("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const newUser = new User({ email });
      user = await newUser.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Example protected route using the verifyToken middleware
router.get("/protected", verifyToken, (req, res) => {
  res
    .status(200)
    .json({ message: "Access to protected route granted", user: req.user });
});

module.exports = router;
