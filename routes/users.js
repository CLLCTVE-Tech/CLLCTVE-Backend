const {User, validateUser, validateUserName, validateDreamJob,
    validateSkill, validateEducation}= require('../models/user');
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
        password: req.body.password,
        phone: req.body.phone
    }
    let {error}= validateUser(userData);
    if (error) return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });

    //check if email is an edu email for now.
    if (!req.body.email.endsWith(".edu"))
    return res.status(404).send("Email must be an edu email");

    //check if password is complex enough:
    var regularExpression = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    if(!regularExpression.test(req.body.password))
    return res.status(404).send("password should contain atleast one number and one special character");

    //we also need to make sure user isn't in the database already
    //we can use the mongoose user model to find the user
    let user = await User.findOne({email:req.body.email});
    if (user) return res.status(404).send('User is already in database.');
    
    //create new user object if validation tests have been passed
    user=new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
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
        return res.status(500).send("There was a problem trying to send the email")
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

//export router
module.exports =router;
