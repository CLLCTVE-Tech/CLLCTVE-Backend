var express = require('express'),
    {User}=require('../models/brand'),
    auth= require('../middleware/auth');
    
var router = express.Router();
const {Job}=require('../models/job');



router.get('/', [auth], async function(req, res) {

    try{

    const jobs = await Job
    .find({user: req.user.id})
    .sort({'date': -1})
    .limit(20);

    return res.status(200).send(jobs);

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}
});

router.get('/:id', [auth], async function(req, res) {

    try{

    

    const job = await Job
    .find({_id: req.params.id});

    if (!job || job.length==0)
    return res.status(404).send("The Job is no longer available")

    return res.status(200).send(job);

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.post('/post', auth, async function(req, res) {
    try{

    
    var jobData = {
        user: req.user.id,
        company: req.body.company,
        jobTitle : req.body.jobTitle,
        level: req.body.level,
        industry: req.body.industry,
        employmentType: req.body.employmentType,
        text: req.body.text
        } ;

    var job = await new Job(jobData);
   
   await job.save()
   return res.status(200).send(job);
    
}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});


module.exports=router;
    