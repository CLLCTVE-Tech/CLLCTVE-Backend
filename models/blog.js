const mongoose = require('mongoose');
const Joi =require('joi');
const{User}=require('./user');
const lodash= require('lodash');
const Schema=mongoose.Schema;


const PostSchema = new mongoose.Schema({
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    description: {type: String, required: false},
    authors: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, required:true},
    content: {type: String,required: true},
    imageUrls: {type: Array,required: false, default:[]}

});
 
const Blog = mongoose.model('Blog', PostSchema);

function validatePost(post){
    schema={
        title: Joi.string().min(15).max(100).required(),
        description: Joi.string().min(25).max(200).required(),
        content: Joi.string().min(25).required()
    };

    return Joi.validate(post, schema);
};

exports.Blog = Blog;
exports.validatePost=validatePost;
