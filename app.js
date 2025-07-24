require('dotenv').config();


const path=require('path');
const express=require('express');
const userroutes=require('./routes/user');
const blogroutes=require('./routes/blog');
const viewroutes = require('./routes/view');
const commentRoutes = require("./routes/comment");
const deleteRoutes = require("./routes/delete");
const mongoose=require('mongoose');
const cookieParser=require('cookie-parser');
const Blog = require('./models/blog');
const checkforauthenticationcookie = require('./middleware/authentication');
const app=express();
const PORT=process.env.PORT||8000;
mongoose.connect(process.env.MONGO_URL).then((e)=>{console.log("Connected to MongoDB")}).catch((err)=>{console.log(err)});

app.set("view engine", "ejs");
app.set("views",path.resolve("./views"));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(checkforauthenticationcookie('token'));
app.use(express.static(path.resolve("./public")));


app.get("/", async (req, res) => {
    const allBlogs = await Blog.find({}).populate("createdBy");
    res.render("homepage", {
        user: req.user,
        blogs: allBlogs,
    });
});

app.use("/user",userroutes);
app.use("/blog",blogroutes);
app.use("/view", viewroutes);
app.use("/comment", commentRoutes);
app.use("/delete", checkforauthenticationcookie("token"), deleteRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
  
  module.exports = app;
  