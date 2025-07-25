const { Router } = require("express");
const router = Router();
const multer = require("multer");
const Blog = require("../models/blog");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

// ✅ Use memory storage and limit file size to 4MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

/**
 * GET /blog/addBlog
 */
router.get("/addBlog", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  res.render("addBlog", {
    user: req.user,
  });
});

/**
 * POST /blog
 */
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.user) return res.status(401).send("Unauthorized: Please log in");

  const { title, body } = req.body;

  try {
    let coverImageUrl = null;

    if (req.file) {
      // ✅ Upload image to Cloudinary
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blogs" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

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
    console.error("❌ Blog upload error:", error);

    let message = "Something went wrong while posting the blog.";
    if (error.message?.includes("File too large")) {
      message = "Image too large. Please upload an image under 4MB.";
    }

    res.status(500).render("message", {
      title: "Upload Failed",
      message,
    });
  }
});

module.exports = router;
