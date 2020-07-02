var express = require('express'),
    {User}=require('../models/user'),
    auth= require('../middleware/auth');
    
var router = express.Router();
const {Job, JobResults, validateJob}=require('../models/job');
const logger=require('../config/logger');
const validateFields= require('../lib/helpers').validateFields;
const {validateSkill}= require('../models/skill');
const _ = require('lodash');



router.get('/', [auth], async function(req, res) {

    try{

    //added pagination
    const jobs = await Job
    .find()
    .skip((Number(req.query.page)-1) * 20)
    .sort({'date': -1})
    .limit(20);

    return res.status(200).send(jobs);

}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.get('/myjobs', [auth], async function(req, res) {

    try{

    //added pagination
    const jobs = await Job
    .find({postedBy: req.user.id})
    .skip((Number(req.query.page)-1) * 20)
    .sort({'date': -1})
    .limit(20);

    const jobResults = await JobResults
    .find({user: req.user.id})
    .skip((Number(req.query.page)-1) * 20)
    .sort({'date': -1})
    .limit(20);

    return res.status(200).send({jobs: jobs, results: jobResults});

}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.get('/:id', [auth], async function(req, res) {

    try{
    //search for the requested job and display it if you find it
    const job = await Job.findOne({_id: req.params.id});
    if (!job || job.length==0) return res.status(404).send("The Job is no longer available")

    await job.updateOne({ $inc: {views:1}});
    await job.save();

    return res.status(200).send(job);

}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.post('/', auth, async function(req, res) {
    try{


    //validate Skills selected
    let errors = {};
    jobData={
              company: req.body.company,
              title : req.body.title,
              type: req.body.type,
              description: req.body.description
            }

    let _skillsErrorsArray = validateFields('skills', req.body.skills, validateSkill);
    let _jobErrorsArray=validateFields('jobs', [jobData], validateJob);
    
    if (!_.isEmpty(_skillsErrorsArray)) errors[`skills`] = _skillsErrorsArray; 
    if (!_.isEmpty(_jobErrorsArray)) errors[`jobs`] = _jobErrorsArray;

    
    if (!_.isEmpty(errors)) {
      return res.status(422).json({
        status: 422,
        message: errors
      });
    }
    
    var jobData = { postedBy: req.user.id,
                    company: req.body.company,
                    title : req.body.title,
                    description: req.body.description,
                    type: req.body.type,
                    skills: req.body.skills,
                } ;

    

    var job = await new Job(jobData);
    var jobResult= await new JobResults({
        jobID: job._id,
        user: req.user.id,
        date: job.date
    })
   
    await job.save();
    await jobResult.save();
    return res.status(200).send(job);
    
}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}

});


router.delete('/:id', [auth], async function(req, res) {

    try{
    //search for the requested job and display it if you find it
    const job = await Job.findOne({_id: req.params.id});
    if (!job || job.length==0) return res.status(404).send("The Job does not exist")

    //check if the user is an admin or the individual who posted the job.
    //if they are not, they should not be able to delete or modify the job.

    if (job.postedBy == req.user.id ||  req.user.role.admin==true){

        //if job exists, we delete the job
        await job.remove();
        return res.status(200).send("Th job was successfully deleted");
    }

    else return res.status(404).send("You do not have permission to delete this job");
    

}

catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.put('/set/:id', [auth], async function(req, res) {

    try{
    //search for the requested job and display it if you find it
    const job = await Job.findOne({_id: req.params.id});
    if (!job || job.length==0) return res.status(404).send("The Job does not exist")

    if (job.postedBy == req.user.id ||  req.user.role.admin==true){

        //if job exists, we open or close the job based on user preferences
        job.open= req.body.open;
        await job.save();
        return res.status(200).send("The job was successfully updated");
    }

    else return res.status(404).send("You do not have permission to edit this job");


}


catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}

});


//should be able to update job info as well

router.put('/:id', [auth], async function(req, res) {

    try{
    //search for the requested job and display it if you find it
    const job = await Job.findOne({_id: req.params.id});
    if (!job || job.length==0) return res.status(404).send("The Job does not exist");

    let errors = {};
    jobData={ 
              company: req.body.company,
              title : req.body.title,
              type: req.body.type,
              description: req.body.description
            }

    //validate data sent to update.
    if (req.body.hasOwnProperty('skills')){
        let _skillsErrorsArray = validateFields('skills', req.body.skills, validateSkill);
        if (!_.isEmpty(_skillsErrorsArray)) errors[`skills`] = _skillsErrorsArray; 
    }

    let _jobErrorsArray=validateFields('jobs', [jobData], validateJob);
    if (!_.isEmpty(_jobErrorsArray)) errors[`jobs`] = _jobErrorsArray;

    
    if (!_.isEmpty(errors)) {
      return res.status(422).json({
        status: 422,
        message: errors
      });
    }
    
    var jobData = {
        company: req.body.company,
        title : req.body.title,
        description: req.body.description,
        type: req.body.type,
        skills: req.body.skills,
        } ;


    if (job.postedBy == req.user.id ||  req.user.role.admin==true){

        //if job exists, we update the job
        await job.updateOne(jobData);
        await job.save();

        return res.status(200).send("The job was successfully updated");
    }

    else return res.status(404).send("You do not have permission to edit this job");

}


catch(error){

    console.error(error);
    logger.error({message:"An error occurred ", error:error})
    return res.status(500).send("Sorry an error occured please try again later.");

}

});



module.exports=router;
    