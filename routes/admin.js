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

router.get('/authorize/brand/signup/:id', [auth,admin], async (req, res) => {

    try{

        

    } catch(error){
        
        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});  

