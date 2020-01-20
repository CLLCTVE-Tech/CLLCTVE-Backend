const {User, validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateSocialMedia, validateExperience}= require('../models/user');
const {Brand}=require('../models/brand');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
const router=express.Router();
const bcrypt =require('bcrypt');
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const request = require('superagent');
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config= require('config');


var mailchimpInstance   = config.get("mailchimpInstance"),
    creativeID        = config.get("creativeID"),
    brandID            = config.get("brandID"),
    mailchimpApiKey     = config.get("mailchimpApiKey");



//verification for normal users

router.get('/confirmation/:token', async (req,res)=>{

    try{

    //this corresponds to the list where users will be added on mailchimp
    //by default lets assume the user is a creative.    
    let listUniqueId=creativeID;
  
    let token=await Token.findOne({ token: req.params.token });
      if (!token) return res.status(404).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });
  
      // If we found a token, find a matching user
      let user= await User.findOne({ _id: token.user})
          if (!user) return res.status(404).send({ msg: 'We were unable to find a user for this token.' });
          if (user.isActive) return res.status(404).send({ type: 'already-verified', msg: 'This user has already been verified.' });
  
          // Verify and save the user
        user.isActive= true;
        await user.save();

    //if the user is indeed a brand, we switch the id to the list where brands are stored.
    if (user.isBrand) listUniqueId=brandID;
  
  
  
      //add user to mailchimp mailing list
     await request
          .post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/')
          .set('Content-Type', 'application/json;charset=utf-8')
          .set('Authorization', 'Basic ' + (mailchimpApiKey).toString('base64'))
          .send({
            'email_address': user.email,
            'status': 'subscribed',
            'merge_fields': {
              'FNAME': user.firstName,
              'LNAME': user.lastName
            }
          })
              .end(function(err, response) {
                if (response.status < 300 || (response.status === 400 && response.body.title === "Member Exists")) {
                  console.log('Signed Up!');
                  return res.status(200).send(user);
                } else {
                  return res.status(404).send('Sign Up Failed :(');
                }
            });
  
          }
  
          catch(error){
            console.log(error)
            return res.status(500).send("Sorry an error occured");
          }
  
  });
  
  //resend confirmation token
  router.post('/resend/login', async(req,res)=>{

    try{
  
    let user = await User.findOne({email:req.body.email});
    if (!user) return res.status(404).send('User does not exist.');

    // Create a verification token, save it, and send email
    var token = await new Token({ user: user._id, token: crypto.randomBytes(16).toString('hex') });
    await token.save();

    //if there is a user, lets resend a token they can use to login.
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
        text: 'This is an automated email to test CLLCTVE  features. Hey ' + user.firstName+ ' thank you for signing up on our platform.' +
        'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api/verify/confirmation\/' + token.token + '.\n'
      };
  
      console.log('http:\/\/' + req.headers.host + '\/api/verify/confirmation\/' + token.token);
  
  
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          return res.status(500).send("There was a problem trying to send the email")
        } else {
          console.log('Email sent: ' + info.response);
          return res.status(200).send('Email sent: ' + info.response)
        }
      });

    }

    catch(error){
        console.log(error);
          return res.status(500).send("There was a problem trying to send the email")
    }

  
  
  });

  //verify token to help with password reset
  router.post('/password/:token', async (req,res)=>{

    try{
  
    let token=await Token.findOne({ token: req.params.token });
      if (!token) return res.status(404).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });
  
      // If we found a token, find a matching user
      let user= await User.findOne({ _id: token.user})
      if (!user) return res.status(404).send({ msg: 'We were unable to find a user for this token.' });



      //now lets compare passwords, hash them and save them to the database.

        if (req.body.password !=req.body.passwordAgain) return res.status(404).send('Passwords do not match');

        const decryptedPassword =await bcrypt.compare(req.body.password, user.password);

        if (decryptedPassword) 
        return res.status(404).send("New password cannot match old password");

        const{error}= Joi.validate({password:req.body.password}, {password: Joi.string().min(8).max(255).required()});
        if (error) return res.status(404).send(error.details[0].message);
        
        const salt=await bcrypt.genSalt(10);
        user.password= await bcrypt.hash(req.body.password, salt);
 
        await user.save();
  
      console.log(user)

      return res.status(200).send("Password Updated Successfully.")

    }

    catch(error){
        console.log(error);
          return res.status(500).send("There was a problem trying to send the email")
    }

    });



//route will only be called if user forgot their password.
  router.post('/resend/password', async(req,res)=>{

    try{
  
    let user = await User.findOne({email:req.body.email});
    if (!user) return res.status(404).send('User does not exist.');

    var token = await new Token({ user: user._id, token: crypto.randomBytes(16).toString('hex') });
    await token.save();

    //if there is a user, lets resend a token they can use to login.
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
        subject: 'Reset Password',
        text: 'This is an automated email to test CLLCTVE  features. Hey ' + req.body.firstName + ' click on this link to reset your password: ' +
        '\nhttp:\/\/' + req.headers.host + '\/api/verify/password\/' + token.token + '.\n'
      };
  
      console.log('http:\/\/' + req.headers.host + '\/api/verify/password\/' + token.token);
  
  
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          return res.status(500).send("There was a problem trying to send the email")
        } else {
          console.log('Email sent: ' + info.response);
          return res.status(200).send('Email sent: ' + info.response)
        }
      });

    }

    catch(error){
        console.log(error);
          return res.status(500).send("There was a problem trying to send the email")
    }
  
  });

  module.exports=router;
