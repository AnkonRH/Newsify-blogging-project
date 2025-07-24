// routes/delete.js
const { Router } = require("express");
const router = Router();
const Blog = require("../models/blog");
const Comment = require("../models/comment");

// POST /delete/blog/:id
// ✅ Correct
router.post("/blog/:id", async (req, res) => {

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Check if user is the creator
    if (!req.user || blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not authorized to delete this blog");
    }

    // Delete comments associated with the blog
    await Comment.deleteMany({ blogId: blog._id });

    // Delete the blog
    await blog.deleteOne();

    res.redirect("/view");
  } catch (error) {
    console.error("Error deleting blog:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
