const {User, Education, Experience, Certification, HonorAward,
  validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateEducation, validateExperience,
    validateCertification, validateHonorsAwards}= require('../models/user');

const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
const router=express.Router();
const bcrypt =require('bcryptjs');
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const joiToForms = require('joi-errors-for-forms').form;
const convertToForms = joiToForms();
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('config');
const logger= require('../config/logger');


//Lets set up a router for our users page

//post request to create user object
router.post('/signup', async (req,res) =>{

    try{
    //validate the user object
    userData={
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
        gradMonthYear: req.body.gradMonthYear
    }
    let {error}= validateUser(userData);
    if (error) {
      console.log('validateUser, convertToForms(error): ', convertToForms(error));
      return res.status(422).json({
        status: 422,
        message: convertToForms(error)
      });
    }


    //check if email is an edu email for now.
    if (!req.body.email.endsWith(".edu"))
    return res.status(401).send("Email must be an edu email"); 

    //check if password is complex enough:
    //var regularExpression = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    var regularExpression= /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    if(!regularExpression.test(req.body.password)) 
    return res.status(401).send("password should contain at least one number and one special character");
    
    //we also need to make sure user isn't in the database already
    //we can use the mongoose user model to find the user
    let user = await User.findOne({email:req.body.email});
    if (user) return res.status(401).send('User is already in database.');
    
    //create new user object if validation tests have been passed
    user=new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        gradMonthYear: req.body.gradMonthYear
    });

    const salt=await bcrypt.genSalt(10);
    user.password= await bcrypt.hash(req.body.password, salt);

    //save new user object 
    await user.save();

    //create token for email verification
    var token = new Token({ user: user._id, token: crypto.randomBytes(16).toString('hex')});
 
    // Save the verification token
    await token.save();

    //send user verification email 
    const transporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      
      auth: {
        user: config.get('emailUser'),
        pass: config.get('emailPass')

      },

    }));

    var mailOptions = {
      from: config.get('emailUser'),
      to: req.body.email,
      subject: 'CLLCTVE Signup',
      text: 'This is an automated email to test CLLCTVE  features. Hey ' + req.body.firstName + ' thank you for signing up on our platform.' +
      'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api/verify/confirmation\/' + token.token + '.\n'
    };

    console.log('http:\/\/' + req.headers.host + '\/api/users/confirmation\/' + token.token);


    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("There was a problem trying to send the email", error)
      } else {
        console.log('Email sent: ' + info.response);
        
      }
    });

           
    //we can use lodash to easily return fields we want to work with
    result=lodash.pick(user, ['firstName','lastName', 'email', 'phone']);
    const web_token=user.generateAuthToken();
    //We can set and return response headers using web tokens
    return res.header('x-auth-token', web_token).status(200).send(
      {"token":web_token,
      user:result});

    } catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };

});

router.post('/onboarding', auth, async(req,res)=>{

  try{

      const current_user=await User.findOne({_id:req.user.id}).select("-password");
      if (!current_user) return res.status(404).send("The User was not found. ");

      //check if req has at least education and experience information, if not,
      //an error will occur.

      if (!req.body.hasOwnProperty("education")) return res.status(401).send("Education is required in the onboarding process");
      if (!req.body.hasOwnProperty("experience")) return res.status(401).send("Experience is required in the onboarding process");

      //check if education and experience are arrays

      if (!Array.isArray(req.body.education)) return res.status("401").send("Education must be in array format");
      if (!Array.isArray(req.body.experience)) return res.status("401").send("Experience must be in array format");
      if (req.body.education.length==0) return res.status("401").send("Education array is empty");
      if (req.body.experience.length==0) return res.status("401").send("Experience array is empty");

      //proceed to add information pertaining to education and experience

    //Validate education from front end
    for (var i = 0; i < req.body.education.length; i++) {

      educationData={
        school: req.body.education[i].school,
        degree: req.body.education[i].degree,
        major: req.body.education[i].major,
        from: req.body.education[i].from,
        to: req.body.education[i].to
    }

      let {error}= validateEducation(educationData);
      if (error) {
        console.log('validateEducation, convertToForms(error): ', convertToForms(error));
        return res.status(422).json({
          status: 422,
          message: convertToForms(error)
        });
      }
      educationData["user"]=req.user.id;
      let education= new Education(educationData);

      current_user.education.push(education);
      await education.save();
    }

    //validate experience array
    for (var i = 0; i < req.body.experience.length; i++) {

      experienceData={
        title: req.body.experience[i].title,
        company: req.body.experience[i].company,
        from: req.body.experience[i].from,
        to: req.body.experience[i].to,
        description: req.body.experience[i]. description
    }
    //check for errors

    let {error}= validateExperience(experienceData);
    if (error) {
      console.log('validateExperience, convertToForms(error): ', convertToForms(error));
      return res.status(422).json({
        status: 422,
        message: convertToForms(error)
      });
    }

    //if there arrent any errors create new education object
    experienceData["user"]=req.user.id;
    let experience= new Experience(experienceData);

    current_user.experience.push(experience);
    await experience.save();

    }


    //check if there's data in honor/awards array and certifications array
    //if data is present, add to user array

    if( req.body.hasOwnProperty('honorsAwards') &&  req.body.honorsAwards.length >0){

      for (var i = 0; i < req.body.honorsAwards.length; i++) {

        honorAwardData={
          title: req.body.honorsAwards[i].title,
          association: req.body.honorsAwards[i].association,
          issuer: req.body.honorsAwards[i].issuer,
          from: req.body.honorsAwards[i].from,
          links: req.body.honorsAwards[i].links,
          description: req.body.honorsAwards[i].description
      }
  
      //check for errors
      let {error}= validateHonorsAwards(honorAwardData);
      if (error) {
        console.log('validateHonorsAwards, convertToForms(error): ', convertToForms(error));
        return res.status(422).json({
          status: 422,
          message: convertToForms(error)
        });
      }
  
      //if there arrent any errors create new honors object
      honorAwardData["user"]=req.user.id;
      const honorAward= new HonorAward(honorAwardData);
  
      current_user.honorsAwards.push(honorAward);
      await honorAward.save();
      }

    }


    if( req.body.hasOwnProperty('certifications') &&  req.body.certifications.length >0){

      for (var i = 0; i < req.body.certifications.length; i++) {

        certificationData={

          title: req.body.certifications[i].title,
          organization: req.body.certifications[i].organization,
          from: req.body.certifications[i].from,
          to: req.body.certifications[i].to,
          certificationID: req.body.certifications[i].certificationID,
          links: req.body.certifications[i].links,
          description: req.body.certifications[i].description
      }
  
      //check for errors
      let {error}= validateCertification(certificationData);
      if (error) {
        console.log('validateCertification, convertToForms(error): ', convertToForms(error));
        return res.status(422).json({
          status: 422,
          message: convertToForms(error)
        });
      }
  
      //if there arrent any errors create new honors object
      certificationData["user"]=req.user.id;
      const certification= new Certification(certificationData);
  
      current_user.certifications.push(certification);
      await certification.save();

      }

    }


    //set onboarding flag to true
    current_user.onboarded=true;
    await current_user.save();
    
      return res.status(200).send({
        message: "Successfully completed Onboarding status",
        user: current_user});
} 
catch(error){

  console.error(error);
  logger.error({message:"An error occurred ", error:error})
  return res.status(500).send("Sorry an error occured please try again later.");  

}
});

//export router
module.exports =router;