//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
//const encrypt = require("mongoose-encryption");

const app = express();
//console.log(process.env.SECRET);
const secretEncrypt = process.env.SECRET;
const port = process.env.PORT;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: secretEncrypt,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://locaLhost:27017/userDB",
{useNewUrlParser: true,
useUnifiedTopology: true}
);

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(encrypt, { secret: secretEncrypt, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if(req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {

  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if(!err){
      passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
     })
    }else {
      console.log(err);
      res.redirect("/register");
    }
  });


//  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    // const newUser = new User({
    //   email: req.body.username,
    //   password: req.body.password
    // });
    //
    // newUser.save((err) => {
    //   if(!err){
    //     res.render("secrets");
    //   }else {
    //    console.log(err);
    //   }
    // });
//  });
});

app.post("/login", (req, res) => {

const user = new User({
  username: req.body.username,
  password: req.body.password
});

req.login(user, (err) => {
  if(!err){
    passport.authenticate("local")(req, res, () => {
      res.redirect("/secrets");
    });
  }else {
    console.log(err);
  }
});
//   const username = req.body.username;
//   const password = req.body.password;
//
//   User.findOne({email: username}, (err, foundUser) => {
//     if(!err){
//         if(foundUser){
//         //  bcrypt.compare(password, foundUser.password, (err, result) => {
//             if(foundUser.password === password){
//                 res.render("secrets");
//             }
//         //  });
//         }
//     }else {
//       console.log(err);
//     }
//   });
 });

 app.listen(port, function(){
   console.log("Server started on port " + port);
});
