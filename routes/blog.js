const { Router } = require("express");
const router = Router();
const multer = require("multer");
const streamifier = require("streamifier");
const Blog = require("../models/blog");
const cloudinary = require("../utils/cloudinary");

// ✅ Use memory storage and limit file size
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

// ✅ GET /blog/addBlog
router.get("/addBlog", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");
  res.render("addBlog", { user: req.user });
});

// ✅ POST /blog
router.post("/", upload.single("image"), async (req, res) => {
  if (!req.user) return res.status(401).send("Unauthorized: Please log in");

  const { title, body } = req.body;

  try {
    let coverImageUrl = null;
    let imagePublicId = null;

    if (req.file) {
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
      imagePublicId = result.public_id;
    }

    await Blog.create({
      title,
      body,
      coverImageUrl,
      imagePublicId,
      createdBy: req.user._id,
    });

    res.redirect("/");
  } catch (error) {
    console.error("❌ Blog upload error:", error);
    const message = error.message?.includes("File too large")
      ? "Image too large. Please upload an image under 4MB."
      : "Something went wrong while posting the blog.";
    res.status(500).render("message", {
      title: "Upload Failed",
      message,
    });
  }
});

// ✅ DELETE /blog/delete/:id
router.post("/delete/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render("message", {
        title: "Not Found",
        message: "Blog not found",
      });
    }

    // ✅ Delete from Cloudinary if uploaded
    if (blog.imagePublicId) {
      await cloudinary.uploader.destroy(blog.imagePublicId);
    }

    await blog.deleteOne();
    res.redirect("/");
  } catch (error) {
    console.error("❌ Blog delete error:", error);
    res.status(500).render("message", {
      title: "Delete Failed",
      message: "Something went wrong while deleting the blog.",
    });
  }
});

module.exports = router;
