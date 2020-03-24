const {User, validateBrand, validateUserName}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const router=express.Router();
const bcrypt =require('bcryptjs');
const config= require('config');
const {Token}= require('../models/tokens');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const logger=require('../config/logger');


//post request to create user object
//post request to create user object
router.post('/signup', async (req,res) =>{

    try{

      console.log(req.body);
    //validate the user object
    userData={
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password, 
        phone: req.body.phone
    }
    var {error}= validateBrand(userData);
    if (error) return res.status(401).send(error.details[0].message);

    //we also need to make sure user isn't in the database already
    //we can use the mongoose user model to find the user
    let user = await User.findOne({email:req.body.email});
    if (user) return res.status(401).send('User is already in database.');

    
    //create new user object if validation tests have been passed
    user=new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone
    });

    //hash and set user password
    const salt=await bcrypt.genSalt(10);
    user.password= await bcrypt.hash(req.body.password, salt);

    //set isBrand to true as brands have to register through this route.
    //We will send an email to admin to verify brands later.

    user.isBrand=true;

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
        user: config.get("emailUser"),
        pass: config.get("emailPass")
      }
    }));

    var mailOptions = {
      from: config.get("emailUser"),
      to: req.body.email,
      subject: 'CLLCTVE Signup',
      text: 'This is an automated email to test CLLCTVE  features. Hey ' + req.body.firstName + ' thank you for signing up on our platform!' +
      'Your application was approved by the CLLCTVE team'+
      ' Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api/verify/confirmation\/' + token.token + '.\n\n'+
      "Your temporary password is "+ req.body.password + ", please log into your account and update your password."
    }; 

    console.log('http:\/\/' + req.headers.host + '\/api/verify/confirmation\/' + token.token);


    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        logger.error({message:"An error occurred ", error:error})
        res.status(500).send("There was a problem trying to send the email")
      } else {
        console.log('Email sent: ' + info.response);
        
      }
    });
           
    //we can use lodash to easily return fields we want to work with
    result=lodash.pick(user, ['firstName','lastName', 'email']);
    const web_token=user.generateAuthToken();
    //We can set and return response headers using web tokens
    return res.header('x-auth-token', web_token).send({
      message: "The User was successfully created",
      User: result,
      token:web_token
    });

    } catch(error){

        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };

});

//export router
module.exports =router;