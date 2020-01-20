var express = require('express'),
    {Brand}=require('../models/brand'),
    auth= require('../middleware/auth'),
	_ = require('underscore'),
	async = require('async'),
	stream_node = require('getstream-node');
	
    
var router = express.Router();
const {Insight}=require('../models/insight');

var FeedManager = stream_node.FeedManager; 
var StreamMongoose = stream_node.mongoose;
var StreamBackend = new StreamMongoose.Backend();

router.get('/', auth, async function(req, res) {

return res.status(200).send("Take a look at all your surveys!");
});

router.post('/create', auth,async (req,res)=>{

const survey=[]
const topics=req.topics;

if (req.type=="yes/no"){

for(i=0; i<topics.length;i++){

    surveyData={
        topic: topics[i],
        choices: [
            {
                value: "Yes",
                votes: 0
            },
            {
                value: "No",
                votes: 0
            }
        ]
    }

    survey.push(surveyData);

}

}

if (req.type=="numerical"){

    for(i=0; i<topics.length;i++){

        surveyData={
            topic: topics[i],
            choices: [
                {
                    value: "1",
                    votes: 0
                },
                {
                    value: "2",
                    votes: 0
                },
                {
                    value: "3",
                    votes: 0
                },
                {
                    value: "4",
                    votes: 0
                },
                {
                    value: "5",
                    votes: 0
                }
            ]
        }

    survey.push(surveyData);
    
    }

}

});

module.exports=router;