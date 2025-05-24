const Item = require("../models/Item");
const fs = require("fs").promises;
const path = require("path");

// Create Item
const createItem = async (req, res) => {
  const { name, type, isPrivate, pin, content, parentId } = req.body;
  const file = req.file;

  try {
    // Validate type
    if (!["folder", "note", "image", "pdf"].includes(type)) {
      return res.status(400).json({ message: "Invalid item type" });
    }

    // Validate file for image and pdf types
    if (type === "image" || type === "pdf") {
      if (!file) {
        return res
          .status(400)
          .json({ message: "File is required for image or pdf type" });
      }
    }

    // Validate content for note type
    if (type === "note" && !content) {
      return res
        .status(400)
        .json({ message: "Content is required for note type" });
    }

    // Validate parentId (must be a folder if provided)
    if (parentId) {
      const parent = await Item.findById(parentId);
      if (!parent || parent.type !== "folder") {
        return res.status(400).json({ message: "Invalid parent folder" });
      }
    }

    const item = new Item({
      userId: req.user.id,
      name,
      type,
      content: type === "note" ? content : undefined,
      filePath: file ? file.path : undefined,
      parentId: parentId || null,
      isPrivate,
      pin,
    });

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Items
const getItems = async (req, res) => {
  try {
    // Include items owned by the user or shared with them
    const items = await Item.find({
      $or: [{ userId: req.user.id }, { sharedWith: req.user.id }],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Item
const updateItem = async (req, res) => {
  const { name, isPrivate, content, parentId } = req.body;
  const file = req.file;

  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Check if user owns the item or it's shared with them
    if (
      item.userId.toString() !== req.user.id &&
      !item.sharedWith.includes(req.user.id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate parentId
    if (parentId) {
      const parent = await Item.findById(parentId);
      if (!parent || parent.type !== "folder") {
        return res.status(400).json({ message: "Invalid parent folder" });
      }
    }

    item.name = name || item.name;
    item.isPrivate = isPrivate !== undefined ? isPrivate : item.isPrivate;
    item.content = content && item.type === "note" ? content : item.content;
    item.filePath = file ? file.path : item.filePath;
    item.parentId = parentId || item.parentId;

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only the owner can delete the item
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete all child items if folder
    if (item.type === "folder") {
      await Item.deleteMany({ parentId: item._id });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle Favorite
const toggleFavorite = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Check if user owns the item or it's shared with them
    if (
      item.userId.toString() !== req.user.id &&
      !item.sharedWith.includes(req.user.id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    item.isFavorite = !item.isFavorite;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Search Items
const searchItems = async (req, res) => {
  const { query, type, date } = req.query;
  try {
    const searchCriteria = {
      $or: [{ userId: req.user.id }, { sharedWith: req.user.id }],
    };
    if (query) searchCriteria.name = { $regex: query, $options: "i" };
    if (type) searchCriteria.type = type;
    if (date) searchCriteria.createdAt = { $gte: new Date(date) };

    const items = await Item.find(searchCriteria);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Copy Item
const copyItem = async (req, res) => {
  const { parentId } = req.body;

  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Check if user owns the item or it's shared with them
    if (
      item.userId.toString() !== req.user.id &&
      !item.sharedWith.includes(req.user.id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate parentId
    if (parentId) {
      const parent = await Item.findById(parentId);
      if (!parent || parent.type !== "folder") {
        return res.status(400).json({ message: "Invalid parent folder" });
      }
    }

    // Helper function to copy an item and its children
    const copyItemRecursively = async (sourceItem, newParentId, ownerId) => {
      let newFilePath = sourceItem.filePath;
      if (sourceItem.filePath) {
        // Copy the file
        const ext = path.extname(sourceItem.filePath);
        const newFileName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${ext}`;
        newFilePath = path.join("uploads", newFileName);
        await fs.copyFile(sourceItem.filePath, newFilePath);
      }

      const newItem = new Item({
        userId: ownerId,
        name: `${sourceItem.name} (Copy)`,
        type: sourceItem.type,
        content: sourceItem.content,
        filePath: newFilePath,
        parentId: newParentId || null,
        isPrivate: sourceItem.isPrivate,
        pin: sourceItem.pin,
        isFavorite: false, // Reset favorite status
        sharedWith: sourceItem.sharedWith,
      });

      await newItem.save();

      // Copy child items if folder
      if (sourceItem.type === "folder") {
        const children = await Item.find({ parentId: sourceItem._id });
        for (const child of children) {
          await copyItemRecursively(child, newItem._id, ownerId);
        }
      }

      return newItem;
    };

    const copiedItem = await copyItemRecursively(
      item,
      parentId || item.parentId,
      req.user.id
    );
    res.status(201).json(copiedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Share Item
const shareItem = async (req, res) => {
  const { userIds } = req.body;

  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only the owner can share the item
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate userIds
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "userIds must be a non-empty array" });
    }

    // Check if users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res
        .status(400)
        .json({ message: "One or more user IDs are invalid" });
    }

    // Add userIds to sharedWith (avoid duplicates)
    item.sharedWith = [...new Set([...item.sharedWith, ...userIds])];
    await item.save();

    res.json({
      message: "Item shared successfully",
      sharedWith: item.sharedWith,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Calendar View
const getCalendarView = async (req, res) => {
  const { groupBy = "day" } = req.query; // day, week, month

  try {
    const items = await Item.find({
      $or: [{ userId: req.user.id }, { sharedWith: req.user.id }],
    });

    // Group items by createdAt date
    const groupedItems = items.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      let key;

      if (groupBy === "month") {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-${
          weekStart.getMonth() + 1
        }-${weekStart.getDate()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    res.json(groupedItems);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  toggleFavorite,
  searchItems,
  copyItem,
  shareItem,
  getCalendarView,
};
