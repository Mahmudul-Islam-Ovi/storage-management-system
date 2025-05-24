const express = require("express");
const router = express.Router();
const {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  toggleFavorite,
  searchItems,
  copyItem,
  shareItem,
  getCalendarView,
} = require("../controllers/itemController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single("file"), createItem);
router.get("/", authMiddleware, getItems);
router.put("/:id", authMiddleware, upload.single("file"), updateItem);
router.delete("/:id", authMiddleware, deleteItem);
router.patch("/:id/favorite", authMiddleware, toggleFavorite);
router.get("/search", authMiddleware, searchItems);
router.post("/:id/copy", authMiddleware, copyItem);
router.post("/:id/share", authMiddleware, shareItem);
router.get("/calendar", authMiddleware, getCalendarView);

module.exports = router;
