const {User}= require('../models/user');
const mongoose =require('mongoose');
const express= require('express');
const lodash=require('lodash');
const router=express.Router();
const bcrypt =require('bcryptjs');
const Joi=require('joi');
const logger= require('../config/logger');

//Lets set up a router for our users page
//post request to create user object
router.post('/', async (req,res) =>{

    try{
    //validate the user object
    userData={
        email: req.body.email,
        password: req.body.password
    }
    const {error}= validate(userData);
    if (error) return res.status(401).send(error.details[0].message);

    //we also need to make sure user is in the database already
    //we can use the mongoose user model to find the user
    let user =await User.findOne({email:req.body.email});
    if (!user) return res.status(404).send('Please provide the correct login information');

    //if the user account has not been verified let them know
    if (!user.isActive) return res.status(401).send('Your account has not been verfified.');
    
    //if the user has not completed the onboarding process, let them know.
    if (!user.onboarded) return res.status(401).send({
        message: 'The User has not completed the onboarding process',
        user: req.user.id,
        email: user.email});
    
    //Lets check if the password matches the encrypted password in the database
    const validPassword=await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(404).send('Please provide correct login details');

    //lets create a json web token to identify users. this will be sent to the server
    const web_token=user.generateAuthToken();

    //its also good practice to store the private key in an environment variable.
    return res.header('x-auth-token', web_token).status(200).send({
        message: "The user was successfully logged in",
        User: user,
        token: web_token
    })
}

catch(error){
    console.error(error);
    logger.error({message:"An error occurred ", error:error})
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