var express = require('express'),
    models = require('../models/tweet'),
    {User}=require('../models/user'),
    {Brand}=require('../models/brand'),
    auth= require('../middleware/auth'),
	_ = require('underscore'),
	async = require('async'),
    stream_node = require('getstream-node'),
    lodash=require('lodash');

var router = express.Router(),
    Follow = models.Follow;
    
var StreamMongoose = stream_node.mongoose;

var did_i_follow = function(users, followers) {
        var followed_users_ids = _.map(followers, function(item) {
            return item.target.toHexString();
        });
        _.each(users, function(user) {
            if (followed_users_ids.indexOf(user._id.toHexString()) !== -1) {
                user.followed = true;
            }
        });
    };


//Get list of people using the site

/******************
      People
    ******************/
    
   router.get('/', auth, function(req, res) {

    try{

    User.find({}).lean().exec(function(err, people) {
        Follow.find({ user: req.user.id }).exec(function(err, follows) {
            if (err) return next(err);
            did_i_follow(people, follows);
            console.log(people.length)
            return res.render('people', {
                location: 'people',
                user: req.user,
                numUsers: people.length,
                people: people,
                path: req.url,
                show_feed: false,
            });
        });
    });

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.get('/:id', auth, async function(req, res) {

    try{

        const user = await User.findOne({_id:req.user.id}).select("-password");
    
        
    
        if (!user || user.length==0){
            var brand= await Brand.findOne({_id:req.user.id}).select("-password");
            if (!brand || brand.length==0){
            return res.status(404).send("User Does not Exist")
            }
            console.log(brand);
            return res.status(200).send(brand)


        }
        
    console.log(user);
    return res.status(200).send(user);
        

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

module.exports=router