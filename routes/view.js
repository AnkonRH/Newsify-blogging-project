const { Router } = require("express");
const router = Router();
const Blog = require("../models/blog");
const Comment = require("../models/comment");

// Homepage: Fetch all blogs with author populated
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().populate("createdBy").sort({ createdAt: -1 });

    res.render("homepage", {
      blogs,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading homepage:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ View single blog with comments
router.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");

    if (!blog) return res.status(404).send("Blog not found");

    const comments = await Comment.find({ blogId: blog._id })
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.render("blog", {
      blog,
      user: req.user,
      comments,
    });
  } catch (err) {
    console.error("Error fetching blog:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ Delete blog (only by its creator)
router.post("/blog/:id/delete", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).send("Blog not found");

    // ✅ Check ownership
    if (!req.user || blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    // ✅ Delete blog & its comments
    await Comment.deleteMany({ blogId: blog._id });
    await blog.deleteOne();

    res.redirect("/");
  } catch (err) {
    console.error("Error deleting blog:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
