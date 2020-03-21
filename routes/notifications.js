var express = require('express'),
    stream_node = require('getstream-node'),
    models = require('../models/tweet'),
    auth= require('../middleware/auth'),
    router = express.Router();


var FeedManager = stream_node.FeedManager;
var StreamMongoose = stream_node.mongoose;
var StreamBackend = new StreamMongoose.Backend();
const logger=require('../config/logger');

var enrichActivities = function(body) {
    var activities = body.results;
    return StreamBackend.enrichActivities(activities);
};

var enrichAggregatedActivities = function(body) {
    var activities = body.results;
    return StreamBackend.enrichAggregatedActivities(activities);
};


/******************
      Notification Feed
    ******************/
    
   router.get('/', auth, function(req,res,next){

    try{

    var notificationFeed = FeedManager.getNotificationFeed(req.user.id);
    

    notificationFeed
        .get({ mark_read: true, mark_seen: true })
        .then(function(body) {
            var activities = body.results;
            if (activities.length == 0) {
                console.log('No Activities');
                return ('No activities');
            } else {
                req.user.unseen = 0;
                //List of all activities
                console.log(StreamBackend.enrichActivities(activities));
                return StreamBackend.enrichActivities(activities[0].activities);
            }
        })
        .then(function(enrichedActivities) {
            console.log(enrichedActivities);
            res.status(200).send({
                activities: enrichedActivities,
                count: enrichedActivities.length,
                layout: false,
            });
        })
        .catch(next);

    }

    catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");

}
});

module.exports = router;
