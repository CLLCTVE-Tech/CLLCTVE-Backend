const mongoose = require('mongoose');
const Joi =require('joi');
const Schema=mongoose.Schema;

const portfolioSchema = new mongoose.Schema(
    {

        user: { type: Schema.Types.ObjectId, required: true},
        title: {type: String, required: false},
        mediaURL: {type: String, required: true},
        date :{type: Date, default: Date.now}
});

function validateTitle(title){
    let schema={
        title: Joi.string().min(3).max(50).optional()
    };
    return Joi.validate(title, schema);
}

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

exports.Portfolio = Portfolio;
exports.validateTitle= validateTitle;