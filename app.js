const config=require('config');
const Joi =require('joi');
const express = require('express');
const users=require('./routes/users');
const mongoose=require('mongoose');
const brands=require('./routes/brands');
const blogs=require('./routes/blogs');
var home=require('./routes/home');
const path=require('path');
const cors=require('cors');

const notifications= require('./routes/notifications');
const messages= require('./routes/messages');
const refer=require('./routes/refer');
const profile=require('./routes/profile');
const people=require('./routes/people');
const dashboard=require('./routes/dashboard');
const jobs=require('./routes/jobs');
const login=require('./routes/login');
const verify= require('./routes/verify');
const applications=require('./routes/applications');
const roles=require('./routes/roles');
const insights= require('./routes/insights');
const status= require('./config/status');


const cron = require('node-cron');
const bodyParser=require('body-parser');
const multer=require('multer');

//Will be used for logging into mongoDB
const winston = require('winston');
require('winston-mongodb');
const logger=require('./config/logger');

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

 
//set up Cors handler
const originWhiteList = config.get("CLLCTVE_CORS");
const corsHandler = cors({
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'x-auth-token',
    'X-Requested-With',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Authorization',
    'Content-Type',
    'dry-run',
    'withCredentials',
    'uid'
  ],
  credentials: true,
  origin: (origin, cb) => {
    cb(null, originWhiteList.indexOf(origin) !== -1);
  },
});

const app=express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//for real time message responses
/*io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});
*/

//let app store files using multer
app.use(multerMid.single('file'))


//let app parse json objects
app.use(express.json());


//enable Cross-origin resource sharing (CORS)
app.use(corsHandler);


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
mongoose.connect(connection_string, { useNewUrlParser: true})
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
app.use('/api/applications', applications);
app.use('/api/roles', roles);
app.use('/api/insights', insights);
app.use('/api/status', status);

const port = process.env.PORT || 3000;


// for real time purposes

app.get('/', (req,res)=>{
  res.status(200).send('Welcome to the CLLCTVE API!!');
});
  
app.listen(port, function(){

  console.log(`Listening on port ${port}....`);
  logger.log("info",`Listening on port ${port}....`);
});
//app.listen(port, ()=>{console.log(`Listening on port ${port}....`)});