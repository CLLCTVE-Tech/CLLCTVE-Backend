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
    const {User, validateUser, validateUserName, validateDreamJob, 
        validateSkill, validateSocialMedia, validateExperience}= require('../models/user');
    

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

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("An error occured. ");

    if(req.body.hasOwnProperty('profilePic')){
        current_user.profilePic =[await imageUpload(req.file, 'profile', req.user.id)];
    }

    if(req.body.hasOwnProperty('profilePic')){
        image_url=uploadProfilePic(current_user, req.body.profilePic);
        current_user.profilePics.push(image_url);
        await current_user.save();
        console.log(image_url);
        
    }

    if(req.body.hasOwnProperty('firstName')){
        const {error}= Joi.validate({firstName: Joi.string().min(5).max(50)}, req.body.firstName);
        if (error) return res.status(404).send(error.details[0].message);
        current_user.firstName = req.body.firstName;
    };

    if(req.body.hasOwnProperty('lastName')){
        const {error}= Joi.validate({lastName: Joi.string().min(5).max(50)}, req.body.lastName);
        if (error) return res.status(404).send(error.details[0].message);
        
        current_user.lastName=req.body.lastName;
    };

    if(req.body.hasOwnProperty('email')){
        const {error}= Joi.validate({email: Joi.string().min(8).max(255).email()}, req.body.email);
        if (error) return res.status(404).send(error.details[0].message);
        
        current_user.email=req.body.email;
    };

    if(req.body.hasOwnProperty('username')){
        const {error}= Joi.validate({username: Joi.string().min(5).max(50)}, req.body.username);
        if (error) return res.status(404).send(error.details[0].message);
        
        current_user.username = req.body.username;
    };

    if(req.body.hasOwnProperty('dreamJob')){
        const {error}= Joi.validate({dreamJob: Joi.string().min(5).max(50)}, req.body.dreamJob);
        if (error) return res.status(404).send(error.details[0].message);
        
        current_user.dreamJob= req.body.dreamJob;
    };

    if(req.body.hasOwnProperty('skills')){
        var skills_split=req.body.skills.split(',');
        console.log(skills_split);

        for (var i = 0; i < skills_split.length; i++) {
            //console.log(skills_split[i]);

            const {error}= validateSkill({skill:skills_split[i]});
            if (error) return res.status(404).send(error.details[0].message);

            current_user.skills.push(skills_split[i]);
        };
    };

        if(req.body.hasOwnProperty('socialMediaHandles')){

            const {error}= validateSocialMedia(req.body.socialMediaHandles);
            if (error) return res.status(404).send(error.details[0].message);

            console.log(req.body.socialMediaHandles.twitter);
                
            if(req.body.socialMediaHandles.hasOwnProperty('facebook')) current_user.set('socialMediaHandles.facebook', req.body.socialMediaHandles.facebook);
            if(req.body.socialMediaHandles.hasOwnProperty('twitter')) current_user.set('socialMediaHandles.twitter', req.body.socialMediaHandles.twitter);
            if(req.body.socialMediaHandles.hasOwnProperty('linkedin')) current_user.set('socialMediaHandles.linkedin', req.body.socialMediaHandles.linkedin);
            if(req.body.socialMediaHandles.hasOwnProperty('instagram')) current_user.set('socialMediaHandles.instagram', req.body.socialMediaHandles.instagram);
            if(req.body.socialMediaHandles.hasOwnProperty('github')) current_user.set('socialMediaHandles.github', req.body.socialMediaHandles.github);
            if(req.body.socialMediaHandles.hasOwnProperty('youtube')) current_user.set('socialMediaHandles.youtube', req.body.socialMediaHandles.youtube);
            
    };


    if(req.body.hasOwnProperty('experience')){

        const {error}=validateExperience(req.body.experience);
        if (error) return res.status(404).send(error.details[0].message);

        current_user.experience.push(req.body.experience);
        
    };

    await current_user.save();
    return res.status(200).send(current_user);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
});


//might move to settings route
router.put('/password', auth, async(req,res)=>{

    try{

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("An error occured. Please Contact us.");

    //check if user knows current password.
    const validPassword=await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(404).send('Please provide correct password');

    //we want the user to enter password twice and make sure it matches
    if (req.body.password != req.body.passwordAgain) return res.status(404).send("Passwords do not match.");
    
    //validate the password
    const{error}= Joi.validate({password: Joi.string().min(8).max(2048)}, req.body.password)
    if (error) return res.status(404).send(error.details[0].message);

    const salt=await bcrypt.genSalt(10);
    var saltPassword=await bcrypt.hash(req.body.password, salt);
    await current_user.update({password: saltPassword});

    return res.status(200).send("Your password has successfully been updated.");

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

    };

});

module.exports=router;