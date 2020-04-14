const {User, Education, Experience, Certification, HonorAward,
  validateUser, validateSkill, validateEducation, validateExperience,
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
    if(!regularExpression.test(req.body.password)){
      return res.status(422).json({
        status: 422,
        message: {password: "\"password\" should contain at least one number and one special character"}
      });
    }
    
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
     
    //check if education is an are arrays
    if (!Array.isArray(req.body.education)) return res.status("401").send("Education must be in array format");
    if (req.body.education.length==0) return res.status("401").send("Education array is empty");
      
    //proceed to add information pertaining to education and other information
    //object to store all errors
    let errors = {};

    //object to store all information
    let information={};

    //array to store skills in after validation
    let validSkills=[];

    //Validate all data from front end
    const education=req.body.education;

    education.forEach(async (_education, index) => {
      console.log('education loop, _education # %d, _education item: %s', index, _education);
  
      let {error}= validateEducation(_education);
      //check if there is an error

      if (error) {
        if (errors['education'] && Array.isArray(errors['education'])) {
             errors.education.push({index, "errors": convertToForms(error)})} 
        else {
          errors.education = [];
          errors.education.push({index, "errors": convertToForms(error)})
        }
      }

      //if there isn't any error, take the data we are interested in
      _education["user"]=req.user.id;

      if (information['education'] && Array.isArray(information['education']['data'])) {
        information.education.data.push(_education)} 
      else {
        information.education = {
          schema: Education, 
          target: current_user.education,
          data:[]
        };

        information.education.data.push(_education);
      }
    });


    if( req.body.hasOwnProperty('experience') &&  req.body.experience.length >0){

    const experience= req.body.experience;

    experience.forEach(async (_experience, index) => {
      console.log('experience loop, _experience # %d, _experience item: %s', index, _experience);
  
      let {error}= validateExperience(_experience);
      //check if there is an error

      if (error) {
        if (errors['experience'] && Array.isArray(errors['experience'])) {
             errors.experience.push({index, "errors": convertToForms(error)})} 
        else {
          errors.experience = [];
          errors.experience.push({index, "errors": convertToForms(error)})
        }
      }
    
    //if there isn't any error, take the data we are interested in
    _experience["user"]=req.user.id;

    if (information['experience'] && Array.isArray(information['experience']['data'])) {
      information.experience.data.push(_experience)} 
    else {
      information.experience = {
        schema: Experience, 
        target: current_user.experience,
        data:[]
      }
      information.experience.data.push(_experience);
    }

    });

  };

    //check if there's data in honor/awards array and certifications array
    //if data is present, add to user array

    if( req.body.hasOwnProperty('honorsAwards') &&  req.body.honorsAwards.length >0){

    const honorsAward= req.body.honorsAwards;

    honorsAward.forEach(async (_honorsAward, index) => {
      console.log('honor awards loop, honor award # %d, _honorsAward item: %s', index, _honorsAward);
  
      let {error}= validateHonorsAwards(_honorsAward);
      //check if there is an error

      if (error) {
        if (errors['honorsAward'] && Array.isArray(errors['honorsAward'])) {
             errors.honorsAward.push({index, "errors": convertToForms(error)})} 
        else {
          errors.honorsAward = [];
          errors.honorsAward.push({index, "errors": convertToForms(error)})
        }
      }
    
    //if there isn't any error, take the data we are interested in
    _honorsAward["user"]=req.user.id;

    if (information['honorsAward'] && Array.isArray(information['honorsAward']['data'])) {
      information.honorsAward.data.push(_honorsAward) } 
    else {
      information.honorsAward = {
        schema: HonorAward, 
        target: current_user.honorsAwards,
        data:[]
      };

      information.honorsAward.data.push(_honorsAward);
    }
    });
     
  };


    if( req.body.hasOwnProperty('certifications') &&  req.body.certifications.length >0){

    const certifications= req.body.certifications;

    certifications.forEach(async (_certification, index) => {
      console.log('certification loop, certification # %d, _certification item: %s', index, _certification);
  
      let {error}= validateCertification(_certification);
      //check if there is an error

      if (error) {
        if (errors['certification'] && Array.isArray(errors['certification'])) {
             errors.certification.push({index, "errors": convertToForms(error)})} 
        else {
          errors.certification = [];
          errors.certification.push({index, "errors": convertToForms(error)})
        }
      }
    
    //if there isn't any error, take the data we are interested in
    _certification["user"]=req.user.id;

    if (information['certification'] && Array.isArray(information['certification']['data'])) {
      information.certification.data.push(_certification)} 
    else {
      information.certification = {
        schema: Certification, 
        target: current_user.certifications,
        data:[]
      };

      information.certification.data.push(_certification);
    }
    });


  };


  //if there are skills present, validate them
  if( req.body.hasOwnProperty('skills') &&  req.body.skills.length >0){
    const skills=req.body.skills;

    skills.forEach(async (_skill, index) =>{
      let {error} = validateSkill({skill: _skill});
      if (error) {
        if (errors['skills'] && Array.isArray(errors['skills'])) {
             errors.skills.push({index, "errors": convertToForms(error)})} 
        else {
          errors.skills = [];
          errors.skills.push({index, "errors": convertToForms(error)})
        }
      }

      else{
        validSkills.push(_skill);
      }

    })
  }

    //check if there are any errors from data we validated from education, experience, etc
  
     if (Object.entries(errors).length > 0) {
      return res.status(422).json({
        status: 422,
        message: errors
      });
    };


    //now store all data we received
    for (var key in information){
      schema=information[key].schema
      target=information[key].target
      data= information[key].data

      data.forEach(async (_entry, index) => {
        //save entries to various documents and add to user information
        console.log(_entry);
        let document= new schema(_entry);
        target.push(document);
        await document.save();
      })
    };

    //store skills as well
    validSkills.forEach( async (_skill, index)=>{
      current_user.skills.push(_skill);
    });

    //set onboarding flag to true
    current_user.onboarded=true;
    await current_user.save();

    result=lodash.pick(current_user, ['firstName','lastName', 'email'])
    
      return res.status(200).send({
        message: "Successfully completed Onboarding status",
        user: result});
} 
catch(error){

  console.error(error);
  logger.error({message:"An error occurred ", error:error})
  return res.status(500).send("Sorry an error occured please try again later.");  

}
});

//export router
module.exports =router;