const {User, validateUser, validateUserName, validateDreamJob, 
    validateSkill, validateEducation}= require('../models/user');
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

//console.log(permissions.admins);


const transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
      user: config.get("emailUser"),
      pass: config.get("emailPass")
    }}));
 

//admins should be able to set levels of access and remove levels of access
//accordingly
router.put('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isAdmin=true;
    await user.save();

    return res.status(200).send({
        message:"The User was successfully given Administrator level access.",
        User: user
    })

});

//set contributor access
router.put('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isContributor=true;
    await user.save();

    return res.status(200).send({
        message:"The User was successfully given Contributor level access.",
        User: user
    })

});


//remove admin access
router.delete('/authorize/permissions/admins', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isAdmin=false;
    await user.save();

    return res.status(200).send({
        message:"The User was successfully given Administrator level access.",
        User: user
    })
});


//remove contributor access
router.delete('/authorize/permissions/contributors', [auth,admin], async (req, res) => {

    //check if the user we want to give admin privileges exists
    const user= await User.findOne({email: req.body.email});
    if (!user) return res.status(404).send("The user does not exist");

    //write permission to permissions file then update database

    user.isContributor=false;
    await user.save();

    return res.status(200).send({
        message:"The User was successfully given contributor level access.",
        User: user
    })

});

//get all permissions
router.get('/authorize/permissions', [auth,admin], async (req, res) => {

    try{ 
        return res.status(200).send(permissions);
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
        users=await User.find({isContributor: true}).limit(25);
         return res.status(200).send(users);
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

        users= await User.find({isAdmin: true}).limit(25);
        console.log(users);
         return res.status(200).send(users);
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