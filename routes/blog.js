const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const fs = require("fs");

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve("./public/uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

/**
 * GET /blog/addBlog
 * Show the blog creation page
 */
router.get("/addBlog", (req, res) => {
  if (!req.user) {
    return res.redirect("/user/signin");
  }

  res.render("addBlog", {
    user: req.user,
  });
});

/**
 * POST /blog/
 * Handle blog creation and redirect to homepage
 */
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized: Please log in first");
  }

  const { title, body } = req.body;

  try {
    await Blog.create({
      title,
      body,
      coverImageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      createdBy: req.user._id,
    });

    // ✅ Redirect to homepage to avoid form resubmission
    res.redirect("/");
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).send("Internal Server Error");
  }
});







module.exports = router;
