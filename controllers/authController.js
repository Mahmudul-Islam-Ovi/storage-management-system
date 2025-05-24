const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Item = require("../models/Item");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
// In-memory token blacklist
const tokenBlacklist = [];

// Register
const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ username, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://your-frontend-url/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `Click here to reset your password: ${resetUrl}`,
    });

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete all items associated with the user
    await Item.deleteMany({ userId: req.user.id });

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account and associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Change Username
const changeUsername = async (req, res) => {
  const { newUsername } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const usernameExists = await User.findOne({ username: newUsername });
    if (usernameExists)
      return res.status(400).json({ message: "Username already taken" });

    user.username = newUsername;
    await user.save();

    res.json({
      message: "Username changed successfully",
      username: newUsername,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(400).json({ message: "No token provided" });

    // Add token to blacklist
    tokenBlacklist.push(token);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  changeUsername,
  logout,
};
