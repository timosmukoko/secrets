//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
//const FacebookStrategy = require("passport-facebook").Strategy;

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
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//userSchema.plugin(encrypt, { secret: secretEncrypt, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
  res.render("home");
});

// app.get("/auth/google", (req, res) => {
//   passport.authenticate("google", {
//     scope: ["profile"]
//   });
// });
app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
   })
  );

  app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect secrets.
      res.redirect("/secrets");
    });

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  User.find({
    "secret": {$ne: null}}, (err, foundUser) => {
      if(!err){
        if(foundUser){
          res.render("secrets", {userWithSecret: foundUser})
        }
      }
    });
});

app.get("/submit", (req, res) => {
  if(req.isAuthenticated()){
    res.render("submit");
  }else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, (err, foundUser) => {
    if(!err){
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save();
        res.redirect("/secrets");
      }
    }else {
      console.log(err);
    }
  })
})

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
