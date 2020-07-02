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
const {BaseApplication,brandApp, jobApp, skillApp, discForm, validateBrand}= require('../models/application');
const permissions=require('../config/persmissions.json');
const logger= require('../config/logger');
const transporter= require("../config/transporter");
const {Job, JobResults}= require('../models/job');
const {Skill}= require('../models/skill');

const applicationMap={
  'brand': brandApp,
  'job': jobApp,
  'discovery': discForm,
  'skill': skillApp
}; 


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

//lets user apply to a specific job
router.post('/job/:id', [auth], async (req, res)=>{

  try{

    const user= await User.findOne({_id: req.user.id})
    if (!user) return res.status(404).send("The User does not exist")

    //check if the job exists first
    const job = await Job.findOne({_id: req.params.id});
    if (!job || job.length==0) return res.status(404).send("The Job does not exist")

    //if the job exists we save the application
    var appData={
      jobID: job._id,
      user: req.user.id,
      email: user.email
    }

    const new_job_app= new jobApp(appData)
    await new_job_app.save()

    await job.updateOne({ $inc: {applicants:1}});
    await job.save();

    return res.status(200).send("The application was successfully submitted.")


  }
  catch(error){
          
          console.error(error);
          logger.error({message:"An error occurred ", error:error})
          return res.status(500).send("Sorry an error occured please try again later.");
      };


});

//submit application to have a skill verified
router.post('/skill', [auth], async (req, res) => {
  try{


    if (!req.body.hasOwnProperty('skill')) return res.status(404).send("No skills sent")
    const user= await User.findOne({_id: req.user.id})
    if (!user) return res.status(404).send("The User does not exist")

    //verify if skill that want to be modified exists
    const saved_skill= await Skill.findOne({_id: req.body.skill});
    if (!saved_skill) return res.status(404).send("The user does not have the skill saved");

    //check if user id and skills match
    if (req.user.id != saved_skill.user) return res.status(404).send("You cannot submit an application for this skill.");
    //now check if the skill has already been verified
    if (saved_skill.verified=="true") return res.status(404).send("The skilll has already been verified");

    //if the skill exists we save the application
    var appData={
      user: req.user.id,
      email: user.email
    }

  //if we have the skill, we create and send in the application
  
  var appData={
    user: req.user.id,
    email: user.email,
    skill: req.body.skill
  }

  const skill_application = new skillApp(appData)
  await skill_application.save()


  return res.status(200).send("Submitted application successfully");
  }

  catch(error){
      
      console.error(error);
      logger.error({message:"An error occurred ", error:error})
      return res.status(500).send("Sorry an error occured please try again later.");
  };
});


//get list of current  applications
router.get('/authorize', [auth], async (req, res) => {

  console.log(req.user);

  try{

  var mongoQuery="";
  if (req.query.type) mongoQuery= {status: 'pending', __t: req.query.type};
  else mongoQuery= {status: 'pending'};

  const current= await BaseApplication
                      .find(mongoQuery)
                      .skip((Number(req.query.page)-1) * 20)
                      .limit(20);

  return res.status(200).send(current)
  }
  catch(error){
      
      console.error(error);
      logger.error({message:"An error occurred ", error:error})
      return res.status(500).send("Sorry an error occured please try again later.");
  };
});

//enable a user to see a list of applications they have made
router.get('/user', [auth], async (req, res) => {

  console.log(req.user);

  try{

  var mongoQuery="";
  if (req.query.type) mongoQuery= {user: req.user.id, __t: req.query.type};
  else mongoQuery= {user: req.user.id};

  const current= await BaseApplication
                      .find(mongoQuery)
                      .skip((Number(req.query.page)-1) * 20)
                      .limit(20);

  return res.status(200).send(current)
  }
  catch(error){
      
      console.error(error);
      logger.error({message:"An error occurred ", error:error})
      return res.status(500).send("Sorry an error occured please try again later.");
  };
});

//view an application
router.get('/authorize/:type/:id', [auth], async (req, res) => {
  try{

  const collection= applicationMap[req.params.type]

  const application= await collection.findOne({_id: req.params.id});
  if (!application) return res.status(404).send("The application does not exist");
  return res.status(200).send(application);
  }

  catch(error){
      
      console.error(error);
      logger.error({message:"An error occurred ", error:error})
      return res.status(500).send("Sorry an error occured please try again later.");
  };
});


//look up an and approve or deny.
router.post('/authorize/user/:type/:id', [auth], async (req, res) => {

  try{

      const collection= applicationMap[req.params.type]

      const application= await collection.findOne({_id:req.params.id});
    
      if (!application) return res.status(404).send("The Application cannot be found");

      if(application.status=="approved") return res.status(401).send("The application has already been approved.");
      if(application.status=="denied") return res.status(401).send("The application was already denied.");

      if (!req.body.response) return res.status(401).send("Please provide a response");
       
      if (req.body.response == "false"){

          //send email to let them know they were not approved.
          //email should vary based on type

          var mailOptions={

            from: config.get("emailUser"),
            to: application.email,
            subject: '',
            text: ''
          }

          if (req.params.type=="brand"){

            mailOptions.subject='An Update on your CLLCTVE Brand Application';
            mailOptions.text='This is an automated email to test CLLCTVE  features. Unfortunalety your brand '+ application.brandName+' was not approved by the CLLCTVE team' +
              ' Thank you for your interest in CLLCTVE and we hope that you consider us for future oppurtunities. ';

          }

          else if(req.params.type=="job"){

            mailOptions.subject='An Update on your Job Application';
            mailOptions.text= 'This is an automated email to test CLLCTVE  features. Unfortunalety your job application was not approved by the CLLCTVE team' +
              ' Thank you for your interest in this position and we hope that you consider our platform for future oppurtunities. ';
          
          }

          else if(req.params.type=="discovery"){

            mailOptions.subject='An Update on your CLLCTVE Discovery Form Application';
            mailOptions.text= 'This is an automated email to test CLLCTVE  features. Unfortunalety your Dsicovery Form Application was not approved by the CLLCTVE team' +
              ' Thank you for your interest in this position and we hope that you consider our platform for future oppurtunities. ';
          
          }
        
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });

          application.status= "denied"
          await application.save()
          return res.status(200).send({
              message:"The application was not approved",
              application: application
      });

      }

  else if(req.body.response == "true"){

    if (req.params.type=="brand"){

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

    }

    else if (req.params.type=="job"){
      //add to results
      //console.log(application)
      jobRes= await JobResults.findOne({jobID: application.jobID});
      jobRes.results.push(application.user);
      await jobRes.save();

    }

    else if (req.params.type=="discovery"){
      //

    }

      application.status="approved"
      await application.save();
      return res.status(200).send({
          message: "The application was approved",
          application: application
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



router.post('/authorize/skill/user/:id', [auth], async (req, res) => {

  try{

    console.log(req.body);
    
      const application= await skillApp.findOne({_id:req.params.id});
      if (!application) return res.status(404).send("The Application cannot be found");

      console.log(application)

      if(application.status=="approved") return res.status(401).send("The application has already been approved.");
      if(application.status=="denied") return res.status(401).send("The application was already denied.");

      //check for the skill
      const current_skill= await Skill.findOne({_id: application.skill});
      if (!current_skill) return res.status(404).send("The skill you want to approve does not exist.")

      if (!req.body.response) return res.status(401).send("Please provide a response");
       
      if (req.body.response == "false"){

          current_skill.verified=false;
          await current_skill.save();
          application.status= "denied"
          await application.save()
          return res.status(200).send({
              message:"The application was not approved",
              application: application
      });

      }

  else if(req.body.response == "true"){
    //we update the document with that skill

    current_skill.verified= true;
    await current_skill.save();

    application.status="approved"
    await application.save();
    return res.status(200).send({
                message: "The application was approved",
          application: application
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



module.exports= router;