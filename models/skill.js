const mongoose = require('mongoose');
const Joi =require('joi');
const Schema=mongoose.Schema;

const SKILLS= [
    'Video Editing',
    'Videography',
    'Photography',
    'Writing',
    'Web Development',
    'Graphic Design',
    'Animation'
  ];

const skillSchema = new mongoose.Schema(
    {

        user: { type: Schema.Types.ObjectId, required: true},
        skill: {type: String, required: true},
        verified: {type: Boolean, required:true, default: false},
        date :{type: Date, default: Date.now}
});

function validateSkill(skill){
    let _skill = {skill};
    let schema={
        skill: Joi.string().valid(SKILLS)
    };
    return Joi.validate(_skill, schema);
}

/*function validateSkill(skill){
    schema={
        skill: Joi.string().min(3).max(50)
    };

return Joi.validate(skill, schema);
}
*/
const Skill = mongoose.model('Skills', skillSchema);

exports.Skill = Skill;
exports.validateSkill= validateSkill;