require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Routes and Models
const userroutes = require('./routes/user');
const blogroutes = require('./routes/blog');
const viewroutes = require('./routes/view');
const commentRoutes = require("./routes/comment");
const deleteRoutes = require("./routes/delete");
const Blog = require('./models/blog');

// Middleware
const checkforauthenticationcookie = require('./middleware/authentication');

const app = express();
const PORT = process.env.PORT || 8000;

// Express and View Setup
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkforauthenticationcookie('token'));
app.use(express.static(path.resolve("./public")));

// Routes
app.use("/user", userroutes);
app.use("/blog", blogroutes);
app.use("/view", viewroutes);
app.use("/comment", commentRoutes);
app.use("/delete", checkforauthenticationcookie("token"), deleteRoutes);

// Home Page Route — with error handling
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).populate("createdBy");
    res.render("homepage", {
      user: req.user,
      blogs: allBlogs,
    });
  } catch (err) {
    console.error("Error fetching blogs:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

// MongoDB Connection + Start Server
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
});
