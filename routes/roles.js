const {Admin, Contributor}= require('../models/role');
const {BaseUser}=require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const jwt=require('jsonwebtoken');
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
const {brandApp, discForm}= require('../models/application')
var generator = require('generate-password');
const permissions=require('../config/persmissions.json');
const {update, load} =require('json-update');
const fs = require('fs');
const {InsightFeed}= require('../models/insight');
const logger=require('../config/logger');



const transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: config.get("emailUser"),
      pass: config.get("emailPass")
    }}));
 

//admins should be able to set levels of access and remove levels of access
//accordingly
router.post('/authorize/permissions/admins', [auth,admin], async(req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if user is already an admin
    let exists=await Admin.findOne({user: req.user.id});
    if(exists) return res.status(400).send("The User is already an admin");

    const admin= new Admin({user: user._id});
    await admin.save();

    return res.status(200).send({
        user: admin
    })
}

catch(error){
    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");
};

});

//set contributor access
router.post('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if a user is a contributor
    let exists=await Contributor.findOne({user: req.user.id});
    if(exists) return res.status(400).send("The User is already a contributor");

    const contributor= new Contributor({user: user._id});
    await contributor.save();

    return res.status(200).send({
        user: contributor
    });
   }

   catch(error){
    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");
};

});


//remove admin access
router.delete('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check for user in admin database then remove
    let admin=await Admin.findOne({user: user._id});
    if(!admin) return res.status(400).send("The User is not an admin.");

    await admin.remove();

    return res.status(200).send("The user's admin privelges were removed.");
    }

    catch(error){
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };


});


//remove contributor access
router.delete('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{

    //check if the user we want to give admin privileges exists
    const user= await BaseUser.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //check if user is already a contributor
    let contributor=await Contributor.findOne({user: user._id});
    if(!contributor) return res.status(400).send("The User is not a contributor.");

    await contributor.remove();
    return res.status(200).send("The user's contributor privelges were removed.");

    }

    catch(error){
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };

});

//get list of all contributors
router.get('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    try{ 
         let contributors=await Contributor.find({}).limit(25);
         return res.status(200).send(contributors);
    }
        catch(error){
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of administrators
router.get('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    try{

         let admins= await Admin.find({}).limit(25);
         return res.status(200).send(admins);
        }
        catch(error){
            console.error(error);
            logger.error({message:"An error occurred ", error:error})
            return res.status(500).send("Sorry an error occured please try again later.");
        };

});

//get list of current brand applications
router.get('/authorize/brand/applications', [auth,admin], async (req, res) => {

    console.log(req.user);

    try{

    const current= await brandApp.find({status: 'pending'});
    return res.status(200).send(current)
    }
    catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});

//view a brands application
router.get('/authorize/brand/applications/:id', [auth,admin], async (req, res) => {
    try{

    const current= await brandApp.find({_id: req.params.id});
    if (!current) return res.status(404).send("The application does not exist");
    return res.status(200).send(current);
    }

    catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});


//look up a brand and approve them.
router.post('/authorize/brand/applications/:id', [auth,admin], async (req, res) => {

    try{

        const brand= await brandApp.findOne({_id:req.params.id});
        if (!brand) return res.status(404).send("The brand's application cannot be found");

        if(brand.status=="approved") return res.status(401).send("The brand's application has already been approved.");
        if(brand.status=="denied") return res.status(401).send("The brand's application was already denied.");

        if (!req.body.response) return res.status(401).send("Please provide a response");
         
        if (req.body.response == "false"){

            //send email to let brand know they were not approved.
          
              var mailOptions = {
                from: config.get("emailUser"),
                to: brand.email,
                subject: 'An Update on your CLLCTVE Application',
                text: 'This is an automated email to test CLLCTVE  features. Unfortunalety your brand '+ brand.brandName+' was not approved by the CLLCTVE team' +
                'Thank you for your interest in CLLCTVE and we hope that you stick with us for future oppurtunities. '
            };
          
          
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

            brand.status= "denied"
            await brand.save()
            return res.status(200).send({
                message:"The brand was not approved",
                brandApplication: brand
        });

        }

    else if(req.body.response == "true"){

        //generate a password for the user and make a request to the brand signup endpoint
        const User = await request.post('http://localhost:3000/api/brands/signup')
        .send({firstName: brand.firstName,
            lastName: brand.lastName,
            email: brand.email,
            username: brand.brandName,
            password: generator.generate({length: 10, numbers: true})
        });

        //create user feed by making call to insights service
        const brandResponse = await request.post('http://localhost:3000/api/insights/feed/add')
        .send({user: brandResponse.user,
            feedID: req.body.feedID,
            createdBy: req.user.id
        });

        brand.status="approved"
        await brand.save();
        return res.status(200).send({
            message: "The brand's application was approved",
            brandApplication: brand
        });

    }

    else{
    return res.status(401).send("Provide a valid response");
    }


    } catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});  

//applications for tier 1 brands. Send email upon completion

//get list of current brand applications relating to tiers
router.get('/authorize/brand/discovery/form', [auth,admin], async (req, res) => {

    try{

    const current= await discForm.find({status: 'pending'});
    return res.status(200).send(current)
    }
    catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});

//view a brands application
router.get('/authorize/brand/discovery/form/:id', [auth,admin], async (req, res) => {
    try{

    const current= await discFrom.find({_id: req.params.id});
    if (!current) return res.status(404).send("The Discovery form does not exist");
    return res.status(200).send(current);
    }

    catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});


//look up a brand and approve them.
router.post('/authorize/brand/discovery/form/:id', [auth,admin], async (req, res) => {

    try{

        const form= await discForm.findOne({_id:req.params.id});
        if (!form) return res.status(404).send("The brand's application cannot be found");

        if(form.status=="completed") return res.status(401).send("The brand's discovery form was already completed.");
        if(form.status=="denied") return res.status(401).send("The brand's discovery form has already been disapproved.");

        if (!req.body.response) return res.status(401).send("Please provide a response");
         
        if (req.body.response == "false"){

            //send email to let brand know their dashboard could not be completed
          
              var mailOptions = {
                from: config.get("emailUser"),
                to: form.email,
                subject: 'An Update on your CLLCTVE Brand Discovery Form',
                text: 'This is an automated email to test CLLCTVE  features. Unfortunalety we were unable to complete your brand disvoery. '+
                'Please contact a memebr of the team for further details.'
            };
          
          
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

            form.status= "denied"
            await form.save()
            return res.status(200).send({
                message:"The brand was not approved",
                brandApplication: form
            });

        }

    else if(req.body.response == "true"){

        //send an email to the brand letting them know their dashboard has been created.
          
        var mailOptions = {
            from: config.get("emailUser"),
            to: form.email,
            subject: 'An Update on your CLLCTVE Brand Discovery Form',
            text: 'This is an automated email to test CLLCTVE  features. We weanted to let you know we officially completed your '+
            'brand discovery form! Please login to view your dashboard!!'
        };
      
      
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

        form.status="completed"
        await form.save();
        return res.status(200).send({
            message:"The brands discovery form was successfully approved.",
            brandApplication: form
        });
        }

    else{
    return res.status(401).send("Provide a valid response");
    }


    } catch(error){
        
        console.error(error);
        logger.error({message:"An error occurred ", error:error})
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});  

module.exports=router;