const express = require("express");
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  changeUsername,
  logout,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.put("/change-username", authMiddleware, changeUsername);
router.post("/logout", authMiddleware, logout);

module.exports = router;
