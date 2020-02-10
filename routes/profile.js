var express = require('express'),
    auth= require('../middleware/auth'),
	stream_node = require('getstream-node'),
    router = express.Router();
	
    var FeedManager = stream_node.FeedManager;
    var StreamMongoose = stream_node.mongoose;
    var StreamBackend = new StreamMongoose.Backend();

    var enrichActivities = function(body) {
        var activities = body.results;
        return StreamBackend.enrichActivities(activities);
    };

    const {imageUpload}= require('../cloud/config/imageUpload');
    const {User, validateSkill, validateExperience, 
        validateDreamJob, validateEducation}= require('../models/user');
    const Joi = require('joi');
    

    /******************
      User Profile
    ******************/
    
   router.get('/', auth, async function(req, res, next) {

    try{
    //we want to get the user but also exculde their password.
    const current_user=await User.findOne({_id:req.user.id}).select("-password");
        

    var userFeed = FeedManager.getUserFeed(req.user.id);
    console.log(userFeed);

    userFeed
        .get({})
        .then(enrichActivities)
        .then(function(enrichedActivities) {
            console.log(enrichedActivities);
            res.send({
                location: 'profile',
                user: current_user,
                profile_user: req.user,
                activities: enrichedActivities,
                path: req.url,
                show_feed: true
            });
        })
        .catch(next);   
    }
    
    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.put('/edit', auth, async(req,res)=>{

    try{

    console.log(req.body)

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("An error occured. ");
    
    if(req.body.hasOwnProperty('firstName')){
        let {error}= Joi.validate({firstName: req.body.firstName}, {firstName: Joi.string().min(5).max(50)});
        if (error) return res.status(404).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('lastName')){
        let {error}= Joi.validate({lastName: req.body.lastName}, {lastName: Joi.string().min(5).max(50)});
        if (error) return res.status(404).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('email')){
        const {error}= Joi.validate({email:req.body.email}, {email: Joi.string().min(8).max(255).email()} );
        if (error) return res.status(404).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('username')){
        const {error}= Joi.validate({username:req.body.username}, {username: Joi.string().min(5).max(50)});
        if (error) return res.status(404).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('dreamJobs')){
        for (var i = 0; i < req.body.dreamJobs.length; i++) {
        const {error}= validateDreamJob({dreamJob: req.body.dreamJobs[i]});
        if (error) return res.status(404).send(error.details[0].message);
        }
    };

    if(req.body.hasOwnProperty('skills')){
        for (var i = 0; i < req.body.skills.length; i++) {
            const {error}= validateSkill({skill:req.body.skills[i]});
            if (error) return res.status(404).send(error.details[0].message);
        };
    };

    if(req.body.hasOwnProperty('experience')){
        for (var i = 0; i < req.body.experience.length; i++) {
        const {error}=validateExperience(req.body.experience[i]);
        if (error) return res.status(404).send(error.details[0].message);
        }
    };

    if(req.body.hasOwnProperty('education')){
        for (var i = 0; i < req.body.education.length; i++) {
        const {error}=validateEducation(req.body.education[i]);
        if (error) return res.status(404).send(error.details[0].message);
        }
    };

    await current_user.update(req.body);
    await current_user.save();
    return res.status(200).send(current_user);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
});


router.put('/edit/profile/picture', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("An error occured. ");

        image_url= await imageUpload(req.file, 'profile', req.user.id);
        current_user.profilePic= image_url;
        await current_user.save();

        return res.status(200).send(current_user);
} catch(error){


    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

    

}
});

router.put('/edit/background/picture', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("An error occured. ");

        image_url= await imageUpload(req.file, 'profile', req.user.id);
        current_user.backgroundPic= image_url;
        await current_user.save();

        return res.status(200).send(current_user);
} catch(error){


    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

    

}
});

module.exports=router;