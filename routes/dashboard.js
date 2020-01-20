var express = require('express'),
    {User}=require('../models/user'),
    auth= require('../middleware/auth'),
    isBrand=require('../middleware/isBrand'),
	_ = require('underscore'),
	async = require('async'),
    stream_node = require('getstream-node'),
    surveys=require('./surveys');
	
    
var router = express.Router();
const {Insight}=require('../models/insight');
var getData= require('../cloud/config/analytics');

var FeedManager = stream_node.FeedManager; 
var StreamMongoose = stream_node.mongoose;
var StreamBackend = new StreamMongoose.Backend();


router.get('/', [auth], async function(req, res) {

    //return res.send("Whats up");

    try{
    
    //check if this is a brand
    var user = await User.findOne({_id:req.user.id});

    if (!user)
    return res.status(400).send("User Does not Exist")

    const insights = await Insight
    .find({user: req.user.id})
    .sort({'date': -1})
    .limit(5);

    

    /*const { metrics, startDate, endDate } = req.query;

    console.log(`Requested metrics: ${metrics}`);
    console.log(`Requested start-date: ${startDate}`);
    console.log(`Requested end-date: ${endDate}`); */

    let metrics=['ga:users','ga:sessions','ga:pageviews'];
    let startDate='30daysAgo';
    let endDate='today';

    Promise.all(getData(metrics, startDate, endDate))
    .then((data) => {
      // flatten list of objects into one object
      const body = {};
      Object.values(data).forEach((value) => {
        Object.keys(value).forEach((key) => {
          body[key] = value[key];
        });
      });
      //add insights to body
      body['insights']=insights;
      //send data
      res.status(200).send({ data: body });
      console.log('Done');
    })
    .catch((err) => {
      console.log('Error:');
      console.log(err);
      console.log('Done');
      return res.status(404).send({message: `${err}` });
    });
}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.post('/test', auth, async function(req, res) {
    try{

    
    var insightData = { user: req.user.id, text: 'This is a test for insights honestly'} ;
    var newInsight = await new Insight(insightData);
   
   await newInsight.save()
   return res.status(200).send(newInsight);
    
}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});


router.get('/graph', [auth], async function(req, res) {

  const { metric } = req.query;

  console.log(`Requested graph of metric: ${metric}`);
  // 1 week time frame
  let promises = [];
  for (let i = 7; i >= 0; i -= 1) {
    promises.push(getData([metric], `${i}daysAgo`, `${i}daysAgo`));
  }


  promises = [].concat(...promises);

  Promise.all(promises)
    .then((data) => {
      // flatten list of objects into one object
      const body = {};
      body[metric] = [];
      Object.values(data).forEach((value) => {
        body[metric].push(value[metric.startsWith('ga:') ? metric : `ga:${metric}`]);
      });
      console.log(body);
      console.log('Done');
      return res.status(200).send({ data: body });
      
    })
    .catch((err) => {
      console.log('Error:');
      console.log(err);
      res.status(404).send({ status: 'Error', message: `${err}` });
      console.log('Done');
    });

});


router.get('/insights', [auth], async function(req, res) {

    try{

      console.log(req.user.id);
    //check if this is a brand
    var user = await User.findOne({_id:req.user.id});
    console.log(user)

    if (!user)
    return res.status(400).send("User Does not Exist")

    const insights = await Insight
    .find({user: req.user.id})
    .sort({'date': -1})
    .limit(20);

    return res.status(200).send(insights);

    }

    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    
    }

  });


module.exports=router
    