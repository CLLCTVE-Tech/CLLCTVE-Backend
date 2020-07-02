const mongoose = require('mongoose');
const Joi =require('joi');
const{User}=require('./user');
const Schema=mongoose.Schema;

const JobSchema = new mongoose.Schema(
    {

        postedBy: { type: Schema.Types.ObjectId, required: true},
        company: {type: String, required: true},
        title : {type: String, required: true},
        type: {type: String, required: true},
        open: {type: Boolean, default:true},
        description: {type: String, required: true},
        skills: {type: Array, required: true, default: []},
        views: {type: Number, required: true, default: 0},
        applicants: {type: Number, required: true, default: 0},
        date :{type: Date, default: Date.now},

});

const JobResultsSchema= new mongoose.Schema({
    jobID: { type: Schema.Types.ObjectId, required: true},
    user: { type: Schema.Types.ObjectId, required: true},
    results : {type: Array, required: true, default: []},
    date: {type: Date, default: Date.now} 
})

function validateJob(job){
    schema={

        company: Joi.string().min(1).max(50).required(),
        title : Joi.string().min(3).max(50).required(),
        type: Joi.string().min(1).max(50).required(),
        description: Joi.string().min(1).max(350).required()
    };

    return Joi.validate(job, schema);
};

const Job = mongoose.model('Jobs', JobSchema);
const JobResults= mongoose.model('Job Results', JobResultsSchema)

exports.Job = Job;
exports.JobResults= JobResults;
exports.validateJob= validateJob;