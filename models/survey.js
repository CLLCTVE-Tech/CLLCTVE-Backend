var mongoose = require('mongoose'),
//config = require('./config/config'),
_ = require('underscore'),
Schema = mongoose.Schema,
stream_node = require('getstream-node');
const {User} = require('./user');
const {Brand}=require('./brand');

mongoose.Promise = global.Promise;


var FeedManager = stream_node.FeedManager;
var StreamMongoose = stream_node.mongoose;



var surveySchema= new mongoose.Schema({

user: {type: Schema.Types.ObjectId, required: true, ref: 'User' },// user that posted the survey
title: {type: String, required: true},
survey: { type: array, required: true},
date :{type: Date, default: Date.now}
},
{
  collection: 'Surveys',
});

surveySchema.methods.getResponses = function() {
    
    results=[]

    for(i=0;i <this.survey.length; i++){

        resultData={
            topic: this.survey[i].topic,
            responses: this.survey[i].choices
        }

        results.push(resultData);

    }

    return results
};

const Survey= new mongoose.model('Surveys', surveySchema);

exports.Survey= Survey;

