const {User, validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateEducation}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const router=express.Router();
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const Joi=require('joi');
const {Token}=require('../models/tokens');
const crypto= require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('config');
const request= require('superagent');
const {brandApp, validateBrand}= require('../models/application');
const permissions=require('../config/persmissions.json');
const logger= require('../config/logger');

const transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: config.get("emailUser"),
      pass: config.get("emailPass")
    }
  }));


router.post('/brand/signup', async (req, res)=>{

    try{

        brandData={
            brandName: req.body.brandName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            website: req.body.website
        };

        const {error}= validateBrand(brandData);
        if (error) return res.status(404).send(error.details[0].message);

        const application = new brandApp(brandData);
        await application.save()

        //email brand that they're application was submitted
        var mailOptions = {
            from: config.get("emailUser"),
            to: req.body.email,
            subject: 'CLLCTVE Application successfully submitted',
            text: 'This is an automated email to test CLLCTVE  features. Thank you for your interest in CLLCTVE! We wanted to let you know that the team has received your application.'
        };
      
          await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        
        //email admins that a new application was received.

        for(i =0; i < permissions.admins.length; i++){

            var mailOptions = {
                from: config.get("emailUser"),
                to: permissions.admins[i],
                subject: 'A brand submitted an Application',
                text: 'This is an automated email to test CLLCTVE  features. The brand '+req.body.brandName +' just submitted an application. Log in to your applications dashboard to view the application.'
            };
          
              await transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
        }

        return res.status(200).send({
          message:"Application was submitted",
          brandApplication: application
        });

        }
    catch(error){
            
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };


});



router.post('/brand/discovery/form', async (req, res)=>{

  try{

    //write code to enable brand to submit discovery form request

  }
  catch(error){
          
          console.error(error);
          logger.error({message:"An error occurred ", error:error})
          return res.status(500).send("Sorry an error occured please try again later.");
      };


});

//route to enable contributors to submit stories
router.post('/contributor/story/form', async (req, res)=>{

  try{

    //write code to enable contributor to submit story request

  }
  catch(error){
          
          console.error(error);
          logger.error({message:"An error occurred ", error:error})
          return res.status(500).send("Sorry an error occured please try again later.");
      };


});

module.exports= router;