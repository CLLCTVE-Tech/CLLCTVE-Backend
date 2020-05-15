const {
  User, Education, Experience, Certification, HonorAward,
  validateUser, validateUserName, validateDreamJob,
  validateSkill, validateEducation, validateExperience,
  validateCertification, validateHonorsAwards
} = require('../models/user');

const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Joi = require('joi');
const {Token} = require('../models/tokens');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require('config');
const joiErrors = require('joi-errors-for-forms');
const joiToForms = joiErrors.form;
const joiToMongoose = joiErrors.mongoose;
const convertToForms = joiToForms();
const convertToMongoose = joiToMongoose();
const setUserInfo = require('../lib/helpers').setUserInfo;
const isArray = require('../lib/helpers').isArray;

//Lets set up a router for our users page

//Login and logout should be handled on the client side


//post request to create user object
router.post('/signup', async (req, res) => {
  
  try {
    //validate the user object
    let userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone
    }
    let {error} = validateUser(userData);
    if (error) {
      return res.status(422).json({
        status: 422,
        message: 'Failed, Error in form',
        errors: convertToForms(error)
      });
    }
    
    //check if email is an edu email for now.
    if (!req.body.email.endsWith('.edu')) {
      return res.status(401).send({
        status: 401,
        message: 'Failed, Error in form',
        errors: {
          'email': 'email must be an edu'
        }
      });
    }
    
    //check if password is complex enough:
    //var regularExpression = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    var regularExpression = /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    if (!regularExpression.test(req.body.password))
      return res.status(401).send('password should contain at least one number and one special character');
    
    //we also need to make sure user isn't in the database already
    //we can use the mongoose user model to find the user
    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(404).json({
      status: 422,
      message: 'Failed, Error in form',
      errors: {
        'email': 'email address already taken.'
      }
    });
    
    //create new user object if validation tests have been passed
    user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password
    });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    //save new user object
    await user.save();
    
    //create token for email verification
    var token = new Token({user: user._id, token: crypto.randomBytes(16).toString('hex')});
    
    // Save the verification token
    await token.save();
    
    //send user verification email
    const transporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      auth: {
        user: config.get('emailUser'),
        pass: config.get('emailPass')
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
    
    
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).send('There was a problem trying to send the email')
      } else {
        console.log('Email sent: ' + info.response);
        //res.status(200).send('Email sent: ' + info.response)
      }
    });
    
    //we can use lodash to easily return fields we want to work with
    // result=lodash.pick(user, ['firstName','email']);
    const web_token = user.generateAuthToken();
    //We can set and return response headers using web tokens
    const userInfo = setUserInfo(user);
    
    //its also good practice to store the private key in an environment variable.
    return res.header('x-auth-token', web_token)
      .status(200)
      .json({
        token: `Bearer ${web_token}`,
        user: userInfo
      });
    
  } catch (error) {
    
    console.error(error);
    
    return res.status(500).json({
      message: 'Sorry an error occured please try again later.',
      errors: error || ''
    });
  }
  
});

router.post('/onboarding', auth, async (req, res) => {
  
  const education = req.body.education;
  
  try {
    const current_user = await User.findOne({_id: req.user.id}).select('-password');
    if (!current_user) return res.status(404).send('The User was not found. ');
    
    if (!req.body.hasOwnProperty('education')) return res.status(422).send({
      message: 'Education is required in the onboarding process'
    });
  
    // if (!req.body.hasOwnProperty("experience")) return res.status(401).send("Experience is required in the onboarding process");
  
    //check if education and experience are arrays
  
    if (!Array.isArray(education)) return res.status(422).send('Education must be in array format');
    
    // if (!Array.isArray(req.body.experience)) return res.status("401").send("Experience must be in array format");
    // if (education.length===0) return res.status("401").send("Education array is empty");
    // if (req.body.experience.length===0) return res.status("401").send("Experience array is empty");
    
    const validationMap = {
      'education': validateEducation,
      'skills': validateSkill,
      'experience': validateExperience,
      'licensesCerts': validateCertification,
      'honorsAwards': validateHonorsAwards,
    };
    
    let additionalFields = [];
    ['experience', 'skills', 'licensesCerts', 'honorsAwards'].forEach((field, index) => {
      if (req.body.hasOwnProperty(`${field}`) && (!Array.isArray(req.body[`${field}`]))) {
        return res.status(422).send({
          message: `${field} must be in array format`
        });
      }
      
      if (req.body.hasOwnProperty(`${field}`)) {
        additionalFields.push(field);
      }
    });
    
    //proceed to add information pertaining to education and experience
    
    //Validate education from front end
    let errors = {};
    let _eduErrorsArray = validateFields('education', education, validateEducation);
    
    if (!_.isEmpty(_eduErrorsArray)) {
      errors[`education`] = _eduErrorsArray;
    }
    
    additionalFields.forEach((_field, index) => {
      let _fieldsErrorsArray = validateFields(_field, req.body[`${_field}`], validationMap[_field]);
      
      if (!_.isEmpty(_fieldsErrorsArray)) {
        errors[`${_field}`] = _fieldsErrorsArray;
      }
    });
    
    if (!_.isEmpty(errors)) {
      return res.status(422).json({
        status: 422,
        message: errors
      });
    }
    
    current_user.education = education;
  
    additionalFields.forEach((_field, index) => {
      current_user[`${_field}`] = req.body[`${_field}`];
    });
    
    //set onboarding flag to true
    current_user.onboarded = true;
    await current_user.save();
    
    return res.status(200).json({
      message: 'Successfully completed Onboarding stats',
      user: current_user
    });
  } catch (error) {
    
    console.error(error);
    logger.error({message: 'An error occurred ', error: error})
    return res.status(500).send('Sorry an error occured please try again later.');
    
  }
});

function validateFields(fieldName, fieldArray, validateFn) {
  let errors = [];
  fieldArray.forEach((_entry, index) => {
    let {error} = validateFn(_entry);
    if (error) {
      errors.push({
        index,
        'errors': convertToForms(error)
      });
    }
  });
  
  if (!_.isEmpty(errors)) {
    return errors;
  }
}

//export router
module.exports = router;
