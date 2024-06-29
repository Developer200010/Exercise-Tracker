const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config()
const mongoose = require("mongoose");



mongoose.connect(process.env.MONGO_URL).then(()=>console.log("db is connected")).catch((error)=> console.log(error.message))
console.log(process.env.MONGO_URL)
console.log(process.env.PORT)
// mongoose
//   .connect("mongodb://127.0.0.1:27017/tracker")
//   .then(() => console.log("db is connected successfully"))
//   .catch((error) => console.log(error.message));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userSchema = mongoose.Schema({
  username:String
},{versionKey:false});
const User = mongoose.model("user", userSchema);

const exerciseSchema = mongoose.Schema({
  username:String,
  description:String,
  duration:Number,
  date:Date,
  userId:String,
}, {versionKey:false} );

const exercise = mongoose.model("exercise", exerciseSchema)

app.post("/api/users",async function (req, res) {
  let{username} = req.body;
  const existUser = await User.findOne({username});
  if(existUser) return res.json({user : "Already existing"});
  const user =await User.create({
    username:username,
  })
  res.send(user);
});

app.get("/api/users",async function(req,res){
  const users = await User.find();
  res.send(users)
});

app.post("/api/users/:_id/exercises", async function(req,res){
  let {description, duration,date}= req.body;
  const userId = req.body[':_id'];
 const foundUser= await User.findById(userId);

 if(!foundUser){
  res.json({message:'No user with such id'});
 }
  if(!date){
    date = new Date();
  }else{
    date = new Date(date);
  }

 const exerciseUser = await exercise.create({
    username:foundUser.username,
    description,
    duration,
    date: date.toDateString(),
    userId
  })
  res.send({
   username:foundUser.username,
    description,
    duration,
    date : date.toDateString(),
    _id:userId,
  })
});

app.get("/api/users/:_id/logs",async function(req,res){
  let{limit, from, to } = req.query;
  const userId = req.params._id;
  const foundUser = await User.findById(userId);
  if(!foundUser) return res.json({message : "No user with such id"});
  let filter = { userId };
  console.log(filter);
  let dateFilter = {};
  console.log(dateFilter);
  if(from){
    dateFilter['$gte'] = new Date(from);
    console.log(dateFilter["$gte"] +" gte");
  }
  if(to){
    dateFilter["$lte"] = new Date(to);
    console.log(dateFilter["$lte"] + " lte");
  }
  if(from || to){
    filter.date = dateFilter;
  }
  if(!limit){
    limit = 100;
  }
  let exercises = await exercise.find(filter).limit(limit);
  exercises = exercises.map((exercise)=>{
    return {
      description:exercise.description,
      duration : exercise.duration,
      date : exercise.date.toDateString(),
    }
  })
  res.json({
    username: foundUser.username,
    count: exercise.length,
    _id:userId,
    log:exercises
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
