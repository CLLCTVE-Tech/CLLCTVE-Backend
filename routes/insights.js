const {BaseUser}= require('../models/user');
const admin = require('../middleware/admin');
const auth=require("../middleware/auth");
const {InsightFeed}= require('../models/insight')
const logger=require('../config/logger');
const request=require('superagent');
const config= require('config');


router.get('/default/feed', [auth], async function(req, res) {

  try{

    let feedID= 266;

    //if we have no queries, return first 10 results from page 1 by default.
    if (Object.keys(req.query)==0){
      const data = await request.get(`https://www.considdr.com/api/v1/projects/${feedID}`)
      .set('X-API-ACCESS-KEY', config.get('considAccess'))
      .set('X-API-SECRET-KEY', config.get('considSecret'));

  return res.status(200).send({
    message: 'Successfully processed insights',
    insights:data.body.insights
  });
    }

    else{

      const data = await request.get(`https://www.considdr.com/api/v1/projects/${feedID}?current_page='+req.query.page +
      '&per_page=`+ req.query.limit)
      .set('X-API-ACCESS-KEY', config.get('considAccess'))
      .set('X-API-SECRET-KEY', config.get('considSecret'));

  return res.status(200).send({
    message: 'Successfully processed insights',
    insights: data.body.insights
  });

    }

  }

  catch(error){

      console.error(error);
      logger.error({message:"An error occurred ", error:error})
      return res.status(500).send("Sorry an error occured please try again later.");
  
  }

});

router.get('/custom/feed', [auth], async function(req, res) {

    try{

      const feed= await InsightFeed.findOne({user: req.user.id})

      //defualt feedID is 266
      if(!feed) return res.status(404).send("Error, you do not have a feed setup");
      let feedID= feed.feedID;

      //if we have no queries, return first 10 results from page 1 by default.
      if (Object.keys(req.query)==0){
        const data = await request.get(`https://www.considdr.com/api/v1/projects/${feedID}`)
        .set('X-API-ACCESS-KEY', config.get('considAccess'))
        .set('X-API-SECRET-KEY', config.get('considSecret'));

    return res.status(200).send({
      message: 'Successfully processed insights',
      insights:data.body.insights
    });
      }

      else{

        const data = await request.get(`https://www.considdr.com/api/v1/projects/${feedID}?current_page='+req.query.page +
        '&per_page=`+ req.query.limit)
        .set('X-API-ACCESS-KEY', config.get('considAccess'))
        .set('X-API-SECRET-KEY', config.get('considSecret'));

    return res.status(200).send({
      message: 'Successfully processed insights',
      insights: data.body.insights
    });

      }

    }

    catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    
    }

  });

router.post('/feed', [auth,admin], async (req, res)=>{

    try{

    
      const current= await BaseUser.findOne({email: req.body.email})
      if (!current) return res.status(401).send("The user you are trying to create a feed for does not exist");
  
      //create a new feed element based on brand info
      feedData={
          user: current._id,
          feedID: req.body.feedID,
          createdBy: req.user.id
      }

    let feed= new InsightFeed(feedData);
    await feed.save();

    return res.status(200).send({
        message: "The feed was successfully created",
        feedObject: feed
    })
    }
    catch(error){
            
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };
  });


  //modify data of a current feed, like change feed id
  router.put('/feed',[auth,admin], async (req, res)=>{

    try{
  
      feed=InsightFeed.findOne({user: req.body.brandID});
      if (!feed) return res.status(404).send("The Feed is not present. Please enter an existing feed");
    
      feed.feedID=req.body.feedID;
      await feed.save();

      return res.status(200).send({
          message: "The User's feed was successfully updated.",
          feedObject: feed
      })

    }
    catch(error){
            
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };
  
  
  });

  router.delete('/feed', [auth,admin], async (req, res)=>{

    try{
        
        //delete a field
        feed=InsightFeed.findOne({user: req.body.brandID});
        if (!feed) return res.status(404).send("The Feed is not present. Please enter an existing feed");
      
        await feed.remove();
        return res.status(200).send({
            message: "The User's feed was successfully deleted.",
            feedObject: feed
        })
  
    }
    catch(error){
            
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };
  
  });

  module.exports= router;