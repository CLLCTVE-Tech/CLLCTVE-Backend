const {User, validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateSocialMedia, validateExperience}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
const router=express.Router();
const bcrypt =require('bcrypt');
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('config');


//Lets set up a router for our users page

//Login and logout should be handled on the client side


//post request to create user object
router.post('/signup', async (req,res) =>{

    try{
    //validate the user object
    userData={
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    }
    const {error}= validateUser(userData);
    if (error) return res.status(404).send(error.details[0].message);

    //we also need to make sure user isn't in the database already
    //we can use the mongoose user model to find the user
    let user = await User.findOne({email:req.body.email});
    if (user) return res.status(404).send('User is already in database.');

    
    //create new user object if validation tests have been passed
    user=new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
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
        pass: config.get("emailPass")
      }
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
        res.status(500).send("There was a problem trying to send the email")
      } else {
        console.log('Email sent: ' + info.response);
        //res.status(200).send('Email sent: ' + info.response)
      }
    });


           
    //we can use lodash to easily return fields we want to work with
    result=lodash.pick(user, ['firstName','email']);
    const web_token=user.generateAuthToken();
    //We can set and return response headers using web tokens
    return res.header('x-auth-token', web_token).send(web_token);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };

});


router.post('/signup/next', auth, async (req,res) =>{

    
    try {
        const current_user=await User.findOne({_id:req.user.id}).select("-password");
        console.log(current_user);
        
        const {error}= validateUserName({username:req.body.username});

        if (error){
            console.log(error);
            console.log(req.body);
            return res.status(500).send(error.details[0].message);
        } 

        current_user.username=req.body.username;

        await current_user.save();
        result=lodash.pick(current_user, ['username']);
        return res.status(200).send(result);
      } catch (error) {

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

      };

});

router.post('/signup/next/next', auth, async (req,res) =>{

    try{

    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    const {error}= validateDreamJob({dreamJob:req.body.dreamJob});

    if (error) return res.status(404).send(error.details[0].message);
    current_user.dreamJob=req.body.dreamJob;
    console.log(current_user.dreamJob);

    var skills_split=req.body.skills.split(',');
    console.log(skills_split);

    for (var i = 0; i < skills_split.length; i++) {
        //console.log(skills_split[i]);

        const {error}= validateSkill({skill:skills_split[i]});
        if (error) return res.status(404).send(error.details[0].message);

        current_user.skills.push(skills_split[i]);
      };

    await current_user.save();

    result=lodash.pick(current_user, ['skills', 'dreamJob']);
    return res.status(200).send(result);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

    };
});


//export router
module.exports =router;