var express = require('express'),
    auth= require('../middleware/auth'),
	stream_node = require('getstream-node'),
    router = express.Router();
	
    var FeedManager = stream_node.FeedManager;
    var StreamMongoose = stream_node.mongoose;
    var StreamBackend = new StreamMongoose.Backend();
    const logger=require('../config/logger');

    var enrichActivities = function(body) {
        var activities = body.results;
        return StreamBackend.enrichActivities(activities);
    };

    const {imageUpload}= require('../cloud/config/imageUpload');
    const {User, Education, Experience, Certification, HonorAward,
        validateSkill, validateExperience, validateEducation,
    validateHonorsAwards, validateCertification}= require('../models/user');
    
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
            res.status(200).send({
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
        if (error) return res.status(401).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('lastName')){
        let {error}= Joi.validate({lastName: req.body.lastName}, {lastName: Joi.string().min(5).max(50)});
        if (error) return res.status(401).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('email')){
        const {error}= Joi.validate({email:req.body.email}, {email: Joi.string().min(8).max(255).email()} );
        if (error) return res.status(401).send(error.details[0].message);
    };

    if(req.body.hasOwnProperty('username')){
        const {error}= Joi.validate({username:req.body.username}, {username: Joi.string().min(5).max(50)});
        if (error) return res.status(401).send(error.details[0].message);
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


router.put('/edit/profile/picture', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        image_url= await imageUpload(req.file, 'profile', req.user.id);
        current_user.profilePic= image_url;
        await current_user.save();

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.put('/edit/background/picture', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The User does not exist");

        image_url= await imageUpload(req.file, 'profile', req.user.id);
        current_user.backgroundPic = image_url;
        await current_user.save();

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.put('/edit/skills', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist.");

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.post('/edit/skills', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        skills=req.body.skills
        if (!Array.isArray(skills)) return res.status("401").send("Skills must be in array format");

        for(i=0; i < skills.length; i++){
            let {error} =validateSkill(skills[i]);
            if (error) return res.status(401).send(error.details[0].message);

            //check if skill is in users list of skills before adding
            let found = current_user.skills.find(element => element == skills[i]);

            if (!found) current_user.skills.push(skills[i])
        }

        await current_user.save();


        return res.status(200).send(
            {message: "Successfully added skills",
        skills:current_user.skills});
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.put('/edit/skills', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        skills=req.body.skills
        if (!Array.isArray(skills)) return res.status("401").send("Skills must be in array format");

        for(i=0; i < skills.length; i++){
            let {error} =validateSkill(skills[i]);
            if (error) return res.status(401).send(error.details[0].message);

            //check if skill is in users list of skills before adding
            let found = current_user.skills.find(element => element == skills[i]);

            if (!found) current_user.skills.push(skills[i])
        }

        await current_user.save();


        return res.status(200).send(
            {message: "Successfully updated skills",
        skills:current_user.skills});
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.delete('/edit/skills', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        skills=req.body.skills
        if (!Array.isArray(skills)) return res.status("401").send("Skills must be in array format");

        for(i=0; i < skills.length; i++){
            let {error} =validateSkill(skills[i]);
            if (error) return res.status(401).send(error.details[0].message);

            //check if skill is in users list of skills in order to delete
            let found = current_user.skills.find(element => element == skills[i]);

            if (!found) current_user.skills.splice(i,1)
        }

        await current_user.save();


        return res.status(200).send(
            {message: "Successfully added skills",
        skills:current_user.skills});

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

        educationData={
            school: req.body.school,
            degree: req.body.degree,
            major: req.body.major,
            gradYear: req.body.gradYear,
            gradMonth: req.body.gradMonth 
        }

        //check for errors
        let {error}= validateEducation(educationData);
        if (error) return res.status(401).send(error.details[0].message);

        //if there arrent any errors create new education object
        const education= new Education({
            user: req.user.id,
            school: req.body.school,
            degree: req.body.degree,
            major: req.body.major,
            gradYear: req.body.gradYear,
            gradMonth: req.body.gradMonth 
        })
    
        current_user.education.push(education);
        await education.save();
        await current_user.save();
            
    
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
    
    router.put('/edit/education', auth, async(req,res)=>{
    
    try{
    
            const current_user=await User.findOne({_id:req.user.id}).select("-password");
            if (!current_user) return res.status(404).send("The user does not exist");
    
            return res.status(200).send(current_user);
    } 
    catch(error){
    
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");  
    
    }
    });
    
    
    router.delete('/edit/education', auth, async(req,res)=>{
    
    try{
    
            const current_user=await User.findOne({_id:req.user.id}).select("-password");
            if (!current_user) return res.status(404).send("The user does not exist");
    
            return res.status(200).send(current_user);
    } 
    catch(error){
    
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");  
    
    }
    });

router.post('/edit/experience', auth, async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        experienceData={
            position: req.body.position,
            company: req.body.company,
            city: req.body.city,
            state: req.body.state,
            from: req.body.from,
            to: req.body.to,
            links: req.body.links,
            description: req.body.description
        }
        //check for errors

        let {error}= validateExperience(experienceData);
        if (error) return res.status(401).send(error.details[0].message);

        //if there arrent any errors create new education object
        const experience= new Experience({
            user: req.user.id,
            position: req.body.position,
            company: req.body.company,
            city: req.body.city,
            state: req.body.state,
            from: req.body.from,
            to: req.body.to,
            links: req.body.links,
            description: req.body.description
        })
    
        current_user.experience.push(experience);
        await experience.save();
        await current_user.save();
            
    
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

router.put('/edit/experience', auth, async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});


router.delete('/edit/experience', auth, async(req,res)=>{

try{

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    if (!current_user) return res.status(404).send("The user does not exist");



    return res.status(200).send(current_user);
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

    honorAwardData={
        title: req.body.title,
        association: req.body.association,
        issuer: req.body.issuer,
        month: req.body.month,
        year: req.body.year,
        links: req.body.links,
        description: req.body.description
    }

    //check for errors
    let {error}= validateHonorsAwards(honorAwardData);
    if (error) return res.status(401).send(error.details[0].message);

    //if there arrent any errors create new honors object
    const honorAward= new HonorAward({
        user: req.user.id,
        title: req.body.title,
        association: req.body.association,
        issuer: req.body.issuer,
        month: req.body.month,
        year: req.body.year,
        links: req.body.links,
        description: req.body.description
    })

    current_user.honorsAwards.push(honorAward);
    await honorAward.save();
    await current_user.save();
        

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


router.put('/edit/honors/awards', auth, async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.delete('/edit/honors/awards', auth, async(req,res)=>{

try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        return res.status(200).send(current_user);
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

        certificationData={

            title: req.body.title,
            organization: req.body.organization,
            issuedMonth: req.body.issuedMonth,
            issuedYear: req.body.issuedYear,
            expMonth: req.body.expMonth ,
            expYear:req.body.expYear,
            certificationID: req.body.certificationID,
            links: req.body.links,
            description: req.body.description
        }
    
        //check for errors
        let {error}= validateCertification(certificationData);
        if (error) return res.status(401).send(error.details[0].message);
    
        //if there arrent any errors create new honors object
        const certification= new Certification({
            user: req.user.id,
            title: req.body.title,
            organization: req.body.organization,
            issuedMonth: req.body.issuedMonth,
            issuedYear: req.body.issuedYear,
            expMonth: req.body.expMonth ,
            expYear:req.body.expYear,
            certificationID: req.body.certificationID,
            links: req.body.links,
            description: req.body.description
        });
    
        current_user.certifications.push(certification);
        await certification.save();
        await current_user.save();
    
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

router.put('/edit/certifications', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

router.delete('/edit/certifications', auth, async(req,res)=>{

    try{

        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        if (!current_user) return res.status(404).send("The user does not exist");

        return res.status(200).send(current_user);
} 
catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");  

}
});

module.exports=router;