var express = require('express'),
    auth= require('../middleware/auth'),
    brand=require('../middleware/brand'),
    stream_node = require('getstream-node'),
    request=require('superagent'),
    router = express.Router();
	
    var FeedManager = stream_node.FeedManager;
    var StreamMongoose = stream_node.mongoose;
    var StreamBackend = new StreamMongoose.Backend();
    const logger=require('../config/logger');
    const joiToForms = require('joi-errors-for-forms').form;
    const convertToForms = joiToForms();
    const {Portfolio, validateTitle} = require('../models/portfolio');
    const {Skill,validateSkill}=require('../models/skill');
    const validateFields= require('../lib/helpers').validateFields;
    const validateSkillFields= require('../lib/helpers').validateSkillFields;
    const _ = require('lodash')

    var enrichActivities =  async function(body) {
        var activities = body.results;
        var results=[];
        let activityFeed= await StreamBackend.enrichActivities(activities);
       
        if (activityFeed.length >0){

            activityFeed.forEach(async (_activity, index) => {

                results.push({
                    actor: _activity.actor._id,
                    foreign_id : _activity.foreign_id,
                    id: _activity.id,
                    object:{
                        likes: _activity.object.likes,
                        comments: _activity.object.comments,
                        _id: _activity.object._id,
                        user:_activity.object.user._id,
                        tweet: _activity.object.tweet,
                        date: _activity.object.date 
                            },
                    origin: _activity.origin,
                    target: _activity.target,
                    time: _activity.time,
                    verb: _activity.verb
                });
            });

        }; 

        return results;
        
        
        
    };

    const {BaseUser, User, Brand, Education, Experience, Certification, HonorAward,
         validateExperience, validateEducation,
    validateHonorsAwards, validateCertification}= require('../models/user');
    const uploadFunction= require('../middleware/upload').sendUploadsToGCS;
    const uploadMiddleware= require('../middleware/upload').uploadFilesMiddleware
    const setType= require('../middleware/type');



    const Joi = require('joi');
    const multer=require('multer');

    const multerMid = multer({
        storage: multer.memoryStorage(),
        limits: {
          // no larger than 5mb.
          fileSize: 5 * 1024 * 1024,
        },
      })
      
    

    /******************
      User Profile
    ******************/
    
   router.get('/user', auth, async function(req, res, next) {

    try{
    //we want to get the user but also exculde their password.
    const current_user=await User.findOne({_id:req.user.id}).select("-password");
        
    /*var userFeed = FeedManager.getUserFeed(req.user.id);
    console.log(userFeed);

    userFeed
        .get({})
        .then(enrichActivities)
        .then(function(enrichedActivities) {
            console.log(enrichedActivities);
            res.status(200).send({
                location: 'profile',
                user: current_user,
                profile_user: req.user,
                activities: enrichedActivities,
                path: req.url,
                show_feed: true
            });
        })
        .catch(next);   */

        portfolio= await Portfolio.find({user:req.user.id});
        skills= await Skill.find({user:req.user.id});
        education=await Education.find({user:req.user.id});
        experiences= await Experience.find({user:req.user.id});
        honorAwards= await  HonorAward.find({user:req.user.id});
        certifications= await Certification.find({user:req.user.id});

        current_user.portfolio=portfolio;
        current_user.skills=skills;
        current_user.education=education;
        current_user.experience=experiences;
        current_user.honorAwards=honorAwards;
        current_user.certifications=certifications;

        await current_user.save();
        res.status(200).send(current_user);
    }
    
    catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.get('/brand', [auth, brand] , async function(req, res, next) {

    try{
    //we want to get the user but also exculde their password.
    const current_user=await Brand.findOne({_id:req.user.id}).select("-password");

    const response = await request.get('http://localhost:3000/api/insights/default/feed')
    .set('x-auth-token', req.header('x-auth-token'))

    console.log(response);
        
    var userFeed = FeedManager.getUserFeed(req.user.id);

    userFeed
        .get({})
        .then(enrichActivities)
        .then(function(enrichedActivities) {
            console.log(enrichedActivities);
            res.status(200).send({
                user: current_user,
                profile_user: req.user,
                activities: enrichedActivities,
                insights: response.body.insights,
                path: req.url,
                show_feed: true
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

router.put('/edit/basic', auth, async(req,res)=>{

    try{

    console.log(req.body)

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("The User does not exist");
    
    if(req.body.hasOwnProperty('firstName')){
        let {error}= Joi.validate({firstName: req.body.firstName}, {firstName: Joi.string().min(5).max(50)});
        if (error) {
            console.log('validateFirstName, convertToForms(error): ', convertToForms(error));
            return res.status(422).json({
              status: 422,
              message: convertToForms(error)
            });
          }
    };

    if(req.body.hasOwnProperty('lastName')){
        let {error}= Joi.validate({lastName: req.body.lastName}, {lastName: Joi.string().min(5).max(50)});
        if (error) {
            console.log('validateLastName, convertToForms(error): ', convertToForms(error));
            return res.status(422).json({
              status: 422,
              message: convertToForms(error)
            });
          }
    };

    if(req.body.hasOwnProperty('email')){
        const {error}= Joi.validate({email:req.body.email}, {email: Joi.string().min(8).max(255).email()} );
        if (error) {
            console.log('validateEmail, convertToForms(error): ', convertToForms(error));
            return res.status(422).json({
              status: 422,
              message: convertToForms(error)
            });
          }
    };

    if(req.body.hasOwnProperty('username')){
        const {error}= Joi.validate({username:req.body.username}, {username: Joi.string().min(5).max(50)});
        if (error) {
            console.log('validateUsername, convertToForms(error): ', convertToForms(error));
            return res.status(422).json({
              status: 422,
              message: convertToForms(error)
            });
          }
    };

    await current_user.update(req.body);
    await current_user.save();
    return res.status(200).send(current_user);

    } catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");

}
});


router.put('/edit/profile/picture', [auth, setType('profile'), uploadMiddleware, uploadFunction], async(req,res)=>{

    try{

        console.log(req.type)
        console.log(req.fileURLs)

        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        current_user.profilePic=req.fileURLs;
        await current_user.save();

        return res.status(200).send("Done");
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.put('/edit/background/picture', [auth, setType('background'), uploadMiddleware, uploadFunction], async(req,res)=>{

    try{

        console.log(req.type)
        console.log(req.fileURLs)

        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        current_user.backgroundPic=req.fileURLs;
        await current_user.save();

        return res.status(200).send("Done");
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.post('/edit/portfolio', [auth, setType('portfolio'), uploadMiddleware, uploadFunction], async(req,res)=>{

    try{

        //check if the user exists first
        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const URLs= req.fileURLs;

        URLs.forEach(async (_objectURL,idx)=>{

            var portfolioObject= new Portfolio({
                user: req.user.id,
                mediaURL: _objectURL
            })

            await portfolioObject.save();
            console.log(portfolioObject);

        })

        return res.status(200).send("Uploaded Changes to User Portfolio");
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.delete('/edit/portfolio/:id', [auth], async(req,res)=>{

    try{

        //check if the user exists first
        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const portfolioObject = Portfolio.findOne({user: req.user.id, _id: req.params.id});
        if (!portfolioObject) return res.status(404).send("The object you are trying to delete does not exist");

        //if it exists, delete the object
        await portfolioObject.deleteOne();

        return res.status(200).send("Uploaded Changes to User Portfolio");
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.post('/edit/skills', [auth], async(req,res)=>{

    try{

        //check if the user exists first
        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");


        let errors={};
        //verify data entered
        let _skillsErrorsArray= validateSkillFields('skills', skills, validateSkill);
        if (!_.isEmpty(_skillsErrorsArray)) {
        errors[`skills`] = _skillsErrorsArray;
            }

        if (!_.isEmpty(errors)) {
            return res.status(422).json({
            status: 422,
            message: errors
            });
        }

        //if there is no error we add the skill
        const skill = new Skill({user: req.user.id, skill: req.body.skill})
        await skill.save();
    

        return res.status(200).send("Successfully added new skill");
        
} 

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.delete('/edit/skill/:id', [auth], async(req,res)=>{

    try{

        //check if the user exists first
        const current_user=await BaseUser.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const skill = Skill.findOne({user: req.user.id, _id: req.params.id});
        if (!skill) return res.status(404).send("The skill you are trying to delete does not exist");

        //if it exists, delete the object
        await skill.deleteOne();

        return res.status(200).send("Successfully deleted skill");
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});


router.post('/edit/education', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        let errors = {};
        let _eduErrorsArray = validateFields('education', req.body.education, validateEducation);
        
        if (!_.isEmpty(_eduErrorsArray)) {
            errors[`education`] = _eduErrorsArray;
        }

        if (!_.isEmpty(errors)) {
            return res.status(422).json({
            status: 422,
            message: errors
            });
        }
        //return res.status(200).send("Works");


        //if there arrent any errors create new education object
        var educationData= req.body.education[0]
        educationData["user"]=req.user.id;
        const education= new Education(educationData);
    
        await education.save();
    
        return res.status(200).send(
            {message:"Successfully added education",
            result: education});
    } 
    catch(error){
    
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");  
    
    }
    });
    
    
router.delete('/edit/education/:id', auth, async(req,res)=>{
    
    try{
        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const education = Education.findOne({user: req.user.id, _id: req.params.id});
        if (!education) return res.status(404).send("The object you are trying to delete does not exist");

        //if it exists, delete the object
        await education.deleteOne();

        return res.status(200).send("Successfully deleted Education item");
    
    } 
    catch(error){
    
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");  
    
    }
    });

router.post('/edit/experience', [auth], async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        let errors = {};
        let _expErrorsArray = validateFields('experience', req.body.experience, validateExperience);
        
        if (!_.isEmpty(_expErrorsArray)) {
            errors[`experience`] = _expErrorsArray;
        }

        if (!_.isEmpty(errors)) {
            return res.status(422).json({
            status: 422,
            message: errors
            });
        }

        //if there arrent any errors create new education object
        var experienceData= req.body.experience[0]
        experienceData["user"]=req.user.id;
        const experience= new Experience(experienceData);
    
        await experience.save();
    
        return res.status(200).send(
            {message:"Successfully added experience",
            result: experience});
    
    } 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});


router.delete('/edit/experience/:id', auth, async(req,res)=>{

try{

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("The user does not exist");

    const experience = Experience.findOne({user: req.user.id, _id: req.params.id});
    if (!experience) return res.status(404).send("The object you are trying to delete does not exist");

    //if it exists, delete the object
    await experience.deleteOne();

    return res.status(200).send("Successfully deleted Experience item");
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});


router.post('/edit/honors/awards', auth, async(req,res)=>{

try{

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("The user does not exist");

    let errors = {};
        let _honorErrorsArray = validateFields('education', req.body.honorsAward, validateHonorsAwards);
        
        if (!_.isEmpty(_honorErrorsArray)) {
            errors[`honorAwards`] = _honorErrorsArray;
        }

        if (!_.isEmpty(errors)) {
            return res.status(422).json({
            status: 422,
            message: errors
            });
        }

        //if there arrent any errors create new education object
        var honorAwardData= req.body.honorsAward[0]
        honorAwardData["user"]=req.user.id;
        const honorAward= new HonorAward(honorAwardData);
    
        await honorAward.save();

    return res.status(200).send(
        {message:"Successfully added Honor/Award",
        result: honorAward});
        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  
}
});


router.delete('/edit/honors/awards/:id', auth, async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const honorAward = HonorAward.findOne({user: req.user.id, _id: req.params.id});
        if (!honorAward) return res.status(404).send("The object you are trying to delete does not exist");

        //if it exists, delete the object
        await honorAward.deleteOne();

        return res.status(200).send("Successfully deleted Honor Award item");

} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.post('/edit/certifications', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        let errors = {};
        let _certErrorsArray = validateFields('education', req.body.certification, validateCertification);
        
        if (!_.isEmpty(_certErrorsArray)) {
            errors[`certification`] = _certErrorsArray;
        }

        if (!_.isEmpty(errors)) {
            return res.status(422).json({
            status: 422,
            message: errors
            });
        }

        //if there arrent any errors create new education object
        var certificationData= req.body.certification[0]
        certificationData["user"]=req.user.id;
        const certification= new Certification(certificationData);
    
        await certification.save();
            
    
        return res.status(200).send(
            {message:"Successfully added Certification",
            result: certification});
}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error: error})
    return res.status(500).send("Sorry an error occured please try again later.");  
}
});



router.delete('/edit/certifications/:id', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        const certification = Certification.findOne({user: req.user.id, _id: req.params.id});
        if (!certification) return res.status(404).send("The object you are trying to delete does not exist");

        //if it exists, delete the object
        await certification.deleteOne();

        return res.status(200).send("Successfully deleted Certification item");

} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

module.exports=router;