const { Router } = require("express");
const router = Router();
const multer = require("multer");
const Blog = require("../models/blog");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier"); // ✅ important

// Use memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /blog/addBlog
 * Show blog creation page
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
 * POST /blog
 * Upload blog with image
 */
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized: Please log in first");
  }

  const { title, body } = req.body;

  try {
    let coverImageUrl = null;

    if (req.file) {
      // ✅ Upload to Cloudinary using streamifier
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blogs" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream); // ✅ fixed
        });
      };

      const result = await streamUpload();
      coverImageUrl = result.secure_url;
    }

    // ✅ Create blog entry in DB
    await Blog.create({
      title,
      body,
      coverImageUrl,
      createdBy: req.user._id,
    });

    res.redirect("/");
  } catch (error) {
    console.error("❌ Error creating blog:", error);
    res.status(500).render("message", {
      title: "Blog Upload Failed",
      message: "Something went wrong while posting the blog. Please try again.",
    });
  }
});

module.exports = router;
