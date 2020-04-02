const {User}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const router=express.Router();
const bcrypt =require('bcrypt');
const Joi=require('joi');
const setUserInfo = require('../lib/helpers').setUserInfo;

//Lets set up a router for our users page
//post request to create user object
router.post('/', async (req,res) =>{

    try{
    //validate the user object
    let userData={
        email: req.body.email,
        password: req.body.password
    }
    
    // const {error}= validate(userData);
    // if (error) return res.status(404).send(error.details[0].message);

    //we also need to make sure user is in the database already
    //we can use the mongoose user model to find the user
    let user =await User.findOne({email:req.body.email});
    
    if (!user) return res.status(401).json({
        message: 'Please provide the correct login information'
    });

    if (!user.isActive) return res.status(404).send('Your account has not been verfified.');
    
    //Lets check if the password matches the encrypted password in the database
    const validPassword=await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({
        message: 'Please provide correct login details'
    });

    //lets create a json web token to identify users. this will be sent to the server
    const web_token=user.generateAuthToken();
    const userInfo = setUserInfo(user);

    //its also good practice to store the private key in an environment variable.
    return res.header('x-auth-token', web_token)
      .status(200).json({
        token: `Bearer ${web_token}`,
        user: userInfo
      });
}

catch(error){
    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");
}

});

function validate(user){
    const schema={
        email: Joi.string().min(8).max(50).email().required(),
        password: Joi.string().min(8).max(1024).required()
    };

    return Joi.validate(user, schema);
}

//export router
module.exports =router;
