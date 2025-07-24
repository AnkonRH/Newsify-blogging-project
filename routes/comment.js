const { Router } = require("express");
const router = Router();
const Comment = require("../models/comment");

// POST a comment to a blog
router.post("/blog/:id/comment", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized: Please log in first");
  }

  const { content } = req.body;
  if (!content || content.trim() === "") {
    return res.status(400).send("Comment content is required");
  }

  try {
    await Comment.create({
      content,
      blogId: req.params.id,
      createdBy: req.user._id,
    });

    res.redirect(`/view/blog/${req.params.id}`);
  } catch (err) {
    console.error("Error creating comment:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
