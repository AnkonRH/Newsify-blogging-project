const { Router } = require("express");
const router = Router();
const multer = require("multer");
const Blog = require("../models/blog");
const cloudinary = require("../utils/cloudinary");

// Use memory storage for multer (uploads handled in memory)
const upload = multer({ storage: multer.memoryStorage() });

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
 * Handle blog creation and upload image to Cloudinary
 */
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized: Please log in first");
  }

  const { title, body } = req.body;

  try {
    let coverImageUrl = null;

    if (req.file) {
      // Cloudinary upload using a stream
      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blogs" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });

      const result = await streamUpload();
      coverImageUrl = result.secure_url;
    }

    await Blog.create({
      title,
      body,
      coverImageUrl,
      createdBy: req.user._id,
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
