const {User}= require('../models/user');
const admin = require('../middleware/admin');
const auth=require("../middleware/auth");
const {InsightFeed}= require('../models/insight')
const logger=require('../config/logger');

router.post('/feed/add', [auth,admin], async (req, res)=>{

    try{
  
      //create a new feed element based on brand info
      feedData={
          user: req.body.brandID,
          feedID: req.body.feedID,
          createdBy: req.user.id
      }

    feed= new InsightFeed(feed);
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
  router.put('/feed/modify',[auth,admin], async (req, res)=>{

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

  router.delete('/feed/delete', [auth,admin], async (req, res)=>{

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