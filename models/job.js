const mongoose = require('mongoose');
const Joi =require('joi');
const{User}=require('./user');
const Schema=mongoose.Schema;

const JobSchema = new mongoose.Schema(
    {

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    company: {type: String, required: true},
    jobTitle : {type: String, required: true},
    level: {type: String, required: true},
    industry: {type: String, required: true},
    employmentType: {type: String, required: true},
    open: {type: Boolean, default:true},
    text: {type: String, required: true},

});

const Job = mongoose.model('Jobs', JobSchema);

exports.Job = Job;