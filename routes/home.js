var express = require('express'),
    models = require('../models/tweet'),
    {User}=require('../models/user'),
    auth= require('../middleware/auth'),
	_ = require('underscore'),
	async = require('async'),
	stream_node = require('getstream-node'),
	fs = require('fs'),
	bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    multer=require('multer'),
    extract = require('mention-hashtag');
    
    var router = express.Router(),
	Tweet = models.Tweet,
    Follow = models.Follow,
    Comment=models.Comment,
    Like=models.Like,
    Tag=models.Tag,
    Mentions=models.Mentions;
    

    var FeedManager = stream_node.FeedManager;
    var StreamMongoose = stream_node.mongoose;
    var StreamBackend = new StreamMongoose.Backend();
    
    var enrichActivities = function(body) {
        var activities = body.results;
        return StreamBackend.enrichActivities(activities);
    };
    
    var enrichAggregatedActivities = function(body) {
        var activities = body.results;
        return StreamBackend.enrichAggregatedActivities(activities);
    };



    router.use(auth, function(req, res, next) {
        //only use this for authenticated users
            res.locals = {
                StreamConfigs: stream_node.settings,
                NotificationFeed: FeedManager.getNotificationFeed(
                    req.user.id 
                )
            };
        next();
    });
    
    router.use(function(error, req, res, next) {
        if (!error) {
            next();
        } else {
            console.error(error.stack);
            return res.status(500).send('An error occured.');
        }
    });
    
    router.use(auth,function(req, res, next) {
        //use for authenticated users
        if (!req.user.id) {
            User.findOne({ username: req.user.username })
                .lean()
                .exec(function(err, user) {
                    if (err) return next(err);
    
                    notificationFeed = FeedManager.getNotificationFeed(user._id);
    
                    req.user.id = user._id;
                    req.user.token = notificationFeed.token;
                    req.user.APP_ID = FeedManager.settings.apiAppId;
                    req.user.APP_KEY = FeedManager.settings.apiKey;
    
                    notificationFeed.get({ limit: 0 }).then(function(body) {
                        if (typeof body !== 'undefined')
                            req.user.unseen = body.unseen;
                        next();
                    });
                });
        } else {
            next();
        }
    }); 

router.get('/account', auth, function(req, res) {
    try{
        res.send({ currentUser: req.user.id });
    }
    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });


// Get Flat Feed
    router.get('/flat', auth, function(req, res, next) {

        try{
        //res.send(req.user)

        var flatFeed = FeedManager.getNewsFeeds(req.user.id)['flat'];
        console.log('flatFeed', flatFeed);
    
        flatFeed
            .get({})
            .then(enrichActivities)
            .then(function(enrichedActivities) {
                console.log('feed', {
                    location: 'feed',
                    user: req.user,
                    activities: enrichedActivities,
                    path: req.url,
                })

                res.send({
                    title: "Flat Feed",
                    location: 'feed',
                    user: req.user,
                    activities: enrichedActivities,
                    path: req.url,
                });
            })
            .catch(next);

        }
        catch(error){

            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }
    });
//Get Aggregated feed
    router.get('/aggregated_feed', auth, function(req, res, next) {

        try{
        var aggregatedFeed = FeedManager.getNewsFeeds(req.user.id)['aggregated'];
        //console.log(aggregatedFeed);
    
        aggregatedFeed
            .get({})
            .then(enrichAggregatedActivities)
            .then(function(enrichedActivities) {

                console.log(enrichedActivities)
                res.send({
                    location: 'aggregated_feed',
                    user: req.user,
                    activities: enrichedActivities,
                    path: req.url,
                });
            })
            .catch(next);
        }
        catch(error){

            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }
    });

    //Follow a user
    router.post('/follow', auth, function(req, res, next) {

        try{

        User.findOne({ _id: req.body.target }, function(err, target) {
            if (target) {
                var followData = { user: req.user.id, target: req.body.target };
                var follow = new Follow(followData);
                follow.save(async function(err) {
                    if (err) next(err);
                    await User.findOneAndUpdate({_id :req.user.id}, {$inc : { following: 1 }});
                    await User.findOneAndUpdate({_id :req.body.target}, {$inc : { followers: 1 }});
                    res.set('Content-Type', 'application/json');
                    return res.status(200).send({ follow: { id: req.body.target } });
                });
            } else {
                return res.status(404).send('Not found');
            }
        });
    }

    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });

    //Unfollow a user
    router.delete('/follow', auth, function(req, res) {

        try{
        Follow.findOne({ user: req.user.id, target: req.body.target }, function(
            err,
            follow
        ) {
            if (follow) {
                follow.remove(async function(err) {
                    if (err) next(err);
                    await User.findOneAndUpdate({_id :req.user.id}, {$inc : { following: -1 }});
                    await User.findOneAndUpdate({_id :req.body.target}, {$inc : { followers: -1 }});
                    res.set('Content-Type', 'application/json');
                    return res.send({ follow: { id: req.body.target } });
                });
            } else {
                return res.status(404).send('Not found');
            }
        });

    }

    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });

    //post a tweet
    router.post('/tweet', auth,  async function(req, res, next) {

        try{

        var tweetData = { user: req.user.id, tweet: req.body.tweet} ;
        var newTweet = new Tweet(tweetData);

        //analyze tweet for hashtags and mentions before saving them
        var values= await extract(req.body.tweet, 'all');
        console.log(values)

        console.log(values.mentions.length)


        //check for mentions and add them accoringly
        if (values.mentions.length >0){
            
            for (i=0; i< values.mentions.length; i++) {

                var target=await User.findOne({username: values.mentions[i].substr(1)})
                if (!target) return res.send("The user you mentioned does not exist!")

                mentionData= {user: req.user.id, target: target._id, tweet: newTweet._id};
                mention=new Mentions(mentionData);
                await mention.save()
            }

        }
        //check for tags and save them
        if (values.hashtags.length >0){
            
            for (i=0; i< values.hashtags.length; i++) {
                tagData= {user: req.user.id, name: values.hashtags[i].substr(1) , tweet: newTweet._id};
                tag=new Tag(tagData);
                await tag.save()
            }

        }

        newTweet.save(async function(err) {
            if (err) next(err);
                res.set('Content-Type', 'application/json');
                await User.findOneAndUpdate({_id :req.user.id}, {$inc : { tweetCount: 1 }});
                return res.status(200).send({ tweet: req.body.tweet });
                });

        }
        catch(error){

                console.error(error);
                return res.status(500).send("Sorry an error occured please try again later.");
        
        }

            
        });

    //Delete a posted tweet
    router.delete('/tweet', auth, function(req, res) {

        try{
       
            var user = req.user;
            var tweetData = { user: req.user.id, tweet: req.body.tweet };

            //check tweet for mentions and tags
            const values= extract(req.body.tweet, 'all');

            //check for mentions and add them accoringly
            if (values.mentions.length >0){
                
                for (i=0; i< values.mentions.length; i++) {
                    mentionData= {user: req.user.id, target: req.body.targets[i], tweet: tweet._id};
                    mention=Mentions.findOne(mentionData);
                    if (mention) 
                    mention.remove()
                }

            }
            //check for tags and delete them
            if (values.tags.length >0){
                
                for (i=0; i< values.tags.length; i++) {
                    tagData= {name: values.tags[i].substr(1) ,user: req.user.id, tweet: tweet._id};
                    mention=Tag.findOne(tagData);
                    if (tag) 
                    tag.remove()
                }

            }

        
            //now remove tweet
            Tweet.findOne(tweetData, async function(err, foundTweet) {
                if (foundTweet) {
                    foundTweet.remove();
                    await User.findOneAndUpdate({_id :req.user.id}, {$inc : { tweetCount: -1 }});
                }
            });
        
            res.set('Content-Type', 'application/json');
            return res.status(200).send({ tweet: req.body.tweet});

        }
        catch(error){

            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }
        });

    //like a tweet 
    router.post('/like', auth,  async function(req, res, next) {

    try{


        var tweet= await Tweet.findOne({_id: req.body.tweetId});
        if (!tweet) return res.status(404).send("Tweet does not exist")
        console.log(tweet);
        var likeData = { user: req.user.id, target: tweet.user, tweet: req.body.tweetId} ;
        var like = new Like(likeData);
        like.save(async function(err) {
            if (err) next(err);
                res.set('Content-Type', 'application/json');
                await Tweet.findOneAndUpdate({_id :req.body.tweetId}, {$inc : { likes: 1 }});
                return res.status(200).send({ like: req.body.tweetId });
                });
            
        }

        catch(error){

            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }

    });

    //Remove like from a specific tweet
    router.delete('/like', auth, function(req, res) {

    try{
       
        var likeData = { user: req.user.id, target: req.body.target, tweet: req.body.tweetId} ;
    
        Like.findOne(likeData, async function(err, foundLike) {
            if (foundLike) {
                foundLike.remove();
                await Tweet.findOneAndUpdate({_id :req.body.tweetId}, {$inc : { likes: -1 }});
            }
        });
    
        res.set('Content-Type', 'application/json');
        return res.status(200).send({ like: req.body.tweetId});

    }


    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });


//comment on a tweet
    router.post('/comment', auth,  async function(req, res, next) {

    try{

        console.log(req.body);
        //create new tweet
        var tweetData = { user: req.user.id, tweet: req.body.comment};
        var tweet = new Tweet(tweetData);

        tweet.save(async function(err) {
            if (err) next(err);
                await User.findOneAndUpdate({_id :req.user.id}, {$inc : { tweetCount: 1 }});
                });

        var parentTweet= await Tweet.findOne({_id: req.body.tweetId});
        if (!parentTweet) return res.status(404).send("The Tweet does not exist");
        console.log(parentTweet);

        var commentData = { user: req.user.id, target: parentTweet.user, 
            tweet: req.body.tweetId, comment: tweet._id};
        var comment = new Comment(commentData);
        comment.save(async function(err) {
            if (err) next(err);
                await Tweet.findOneAndUpdate({_id :req.body.tweetId}, {$inc : { comments: 1 }});
                return res.status(200).send({ comment: req.body.comment});
                });

        }

        catch(error){

            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }
            
        });

//Remove comment from a specific tweet
    router.delete('/comment', auth, function(req, res) {


    try{

        var tweetData = { user: req.user.id, tweet: req.body.tweet };

        //check tweet for mentions and tags
        const values= extract(req.body.tweet, 'all');

        //check for mentions and add them accoringly
        if (values.mentions.length >0){
            
            for (i=0; i< values.mentions.length; i++) {
                mentionData= {user: req.user.id, target: req.body.targets[i], tweet: tweet._id};
                mention=Mentions.findOne(mentionData);
                if (mention) 
                mention.remove()
            }

        }
        //check for tags and delete them
        if (values.tags.length >0){
            
            for (i=0; i< values.tags.length; i++) {
                tagData= {name: values.tags[i].substr(1) ,user: req.user.id, tweet: tweet._id};
                mention=Tag.findOne(tagData);
                if (tag) 
                tag.remove()
            }

        }
        
        Tweet.findOne(tweetData, async function(err, foundTweet) {
            if (foundTweet) {

                var commentData = { user: req.user.id, target: req.body.target, 
                    tweet: req.body.tweetId, comment: foundTweet._id};
        
                Comment.findOne(commentData, async function(err, foundComment) {
                    if (foundComment) {
                        foundComment.remove();
                        await Tweet.findOneAndUpdate({_id :req.body.tweetId}, {$inc : { comments: -1 }});
                    }
                });


                foundTweet.remove();
                await Tweet.findOneAndUpdate({_id :req.body.tweetId}, {$inc : { likes: -1 }});
            }
        });

        res.set('Content-Type', 'application/json');
        return res.status(200).send({ comment: req.body.tweetId});

    }
    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });        
        

 module.exports = router;
