var express = require('express'),
    {User}=require('../models/user'),
    auth= require('../middleware/auth'),

	_ = require('underscore'),
	async = require('async'),
    stream_node = require('getstream-node'),
    surveys=require('./surveys'),
    config= require('config');
	
    
var router = express.Router();
const {Insight}=require('../models/insight');
const request= require('superagent');
var getData= require('../cloud/config/analytics');

var FeedManager = stream_node.FeedManager; 
var StreamMongoose = stream_node.mongoose;
var StreamBackend = new StreamMongoose.Backend();

const {InsightFeed}= require('../models/insight');
const logger= require('../config/logger');


router.get('/', [auth], async function(req, res) {

    //return res.send("Whats up");

    try{
    
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
      
      //send data
      res.status(200).send({ data: body });
      console.log('Done');
    })
    .catch((err) => {
      console.log('Error:');
      console.log(err);
      console.log('Done');
      return res.status(500).send({message: `${err}` });
    });
}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
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
      res.status(500).send({ status: 'Error', message: `${err}` });
      console.log('Done');
    });

});





module.exports=router;
    