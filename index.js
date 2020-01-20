const config=require('config');
const Joi =require('joi');
const express = require('express');
const users=require('./routes/users');
const mongoose=require('mongoose');
const brands=require('./routes/brands');
const blogs=require('./routes/blogs');
var home=require('./routes/home');
const path=require('path');

const notifications= require('./routes/notifications');
const messages= require('./routes/messages');
const refer=require('./routes/refer');
const profile=require('./routes/profile');
const people=require('./routes/people');
const dashboard=require('./routes/dashboard');
const jobs=require('./routes/jobs');
const login=require('./routes/login');
const verify= require('./routes/verify');
const cron = require('node-cron');
const bodyParser=require('body-parser');
const multer=require('multer');

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

 
/*cron.schedule('* * * * *', () => {
  console.log('running a task every minute from index.js');
}); */

const app=express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//for real time message responses
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});


//let app store files using multer
app.use(multerMid.single('file'))

//let app parse json objects
app.use(express.json());


//For Pug
app.set('view engine', 'pug');


//Check if jwtPrivateKey environment env has been set
if (!config.get("jwtPrivateKey")){
  console.log("FATAL ERROR, jwtPrivateKey has not been set");
  process.exit(1);
}

if (!config.get("brandPrivateKey")){
  console.log("FATAL ERROR, brandPrivateKey has not been set");
  process.exit(1);
}

//connect to database
const connection_string=config.get("mongoString");
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(connection_string, { useNewUrlParser: true })
.then(()=> console.log("Successfully Connected to Database..."))
.catch(err=> console.log("Failed to connect to databse..."));


//enable this so we can parse for json objects in the body of the request
//app.use(express.json());
//given the current route, express app will use user that was router exported
app.use('/api/home', home);
app.use('/api/notifications', notifications);
app.use('/api/users', users);
app.use('/api/messages', messages);
app.use('/api/refer', refer);
app.use('/api/profile', profile);
app.use('/api/people', people);
app.use('/api/dashboard', dashboard);
app.use('/api/jobs', jobs);
app.use('/api/brands', brands);
app.use('/api/blogs', blogs);
app.use('/api/login',login);
app.use('/api/verify', verify);

const port = process.env.PORT || 3000;


// for real time purposes

app.get('/', (req,res)=>{
  res.sendFile(__dirname + '/routes/message.html');
});
  



app.listen(3000, function(){
  console.log(`Listening on port ${port}....`);
})
//app.listen(port, ()=>{console.log(`Listening on port ${port}....`)});