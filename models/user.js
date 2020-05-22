const Mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');
const SKILLS = require('../lib/helpers').skills;

//Create User Schema before feeding it into the Model object

const userSchema=new Mongoose.Schema({

    username:{
        type: String,
        minlength: 5,
        maxlength: 50
    },

    firstName:{
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },

    lastName:{
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },

    email:{
        type: String,
        required: true,
        minlength: 10,
        maxlength: 255,
        unique: true //prevents same email from being stored
    },
    
    phone:{
        type: String,
        unique: true,
        required: false,
        minlength: 10,
        maxlength: 10,
    },

    gradMonthYear: {type: String, required: false},

    //This is how we differentiate creatives from brands
    isBrand: {type: Boolean, required: true, default: false},

    following: {type: Number, default:0,},
    followers: {type: Number, default:0},
    tweetCount: {type: Number, default:0},


    profilePic: {type:Array, default: []},

    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    },

    dreamJobs: {type:Array, default: []},

    about:{
        type: String,
        required: false,
        minlength: 5,
        maxlength: 500
    },

    //we can use this for role based authorization
    isAdmin: {type:Boolean, default: false},
    isContributor: {type:Boolean, default: false},
    
    isVerified: {type:Boolean, default: false},
    skills: {type:Array, default: []},
    isActive: {type: Boolean, default: false},
    
    licensesCerts:[{
        title: String,
        organization: String,
        issuedMonthYear: String,
        expMonthYear: String,
        certificationID: String,
        links: String,
        description: String,
        canExpire: Boolean
    }],
    
    experience:[{
        title: String,
        company: String,
        startDate: String,
        endDate: String,
        city: String,
        state: String,
        description: String,
        currentEmployer: Boolean
    }],

    education:[{
        school: String,
        major: String,
        degreeType: String,
        startMonthYear: String,
        endMonthYear: String,
        isEnrolled: Boolean,
    }],
    
    honorsAwards:[{
        title: String,
        association: String,
        issuer: String,
        issuedMonthYear: String,
        links: String,
        description: String,
    }],

    //this will determine membership
    membership:{type: String, required: true, default: 'normal'},

    socialMediaHandles: {
        type: Map,
        of: String
      },

    joined: {type: Date, default: Date.now},
    onboarded: {type: Boolean, default: false}
});

//We have generated webtokens for each user in different files (auth and users), however,
//it would be easier to just create a function that generates a web token from the user model each time.
//we can create fucntions with the user model using mongoose!

userSchema.methods.generateAuthToken = function() {
    const token=jwt.sign({id:this._id, isAdmin: this.isAdmin}, config.get('jwtPrivateKey'));
    return token;
};

const UserModel=Mongoose.model("User", userSchema);

function validateUser(user){
    let schema={
        firstName: Joi.string().min(5).max(50).required(),
        lastName: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(8).max(255).required().email(),
        password: Joi.string().min(8).max(255).required(),
        phone: Joi.string().min(10).max(10)
    };

    return Joi.validate(user, schema, { convert: true, abortEarly: false });
}

function validateUserName(userName){
    let schema={
        username: Joi.string().min(5).max(50).required()
    };
    return Joi.validate(userName, schema);
}

function validateDreamJob(job){
    
    let schema={
        dreamJob: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(job, schema);
}

function validateSkill(skill){
    let _skill = {skill};
    let schema={
        skill: Joi.string().valid(SKILLS)
    };
    return Joi.validate(_skill, schema);
}

function validateSocialMedia(socialMedia){

    let schema={
    twitter:Joi.string().min(4).max(250),
    linkedin:Joi.string().min(4).max(250),
    instagram:Joi.string().min(4).max(250),
    github:Joi.string().min(4).max(250),
    facebook:Joi.string().min(4).max(250),
    youtube: Joi.string().min().max(250)
    };

    return Joi.validate(socialMedia, schema);
}

function validateExperience(userExperience){

    let schema={
        title: Joi.string().min(3).max(60).required(),
        company: Joi.string().min(3).max(60).required(),
        city: Joi.string().min(5).max(60).optional(),
        state: Joi.string().min(2).max(15).optional(),
        startDate: Joi.string().min(5).max(50),
        endDate: Joi.string().min(5).max(50),
        description: Joi.string().min(15).max(200).optional(),
        currentEmployer: Joi.boolean()
    };

    if (userExperience.currentEmployer===true) schema.endDate=Joi.date().toString();

    return Joi.validate(userExperience, schema, { convert: true, abortEarly: false });
}

function validateEducation(education){

    let schema={
        school: Joi.string().min(3).max(60).required(),
        degree: Joi.string().min(5).max(60).required(),
        major: Joi.string().min(3).max(60).required(),
        startMonthYear: Joi.string().min(5).max(50),
        gradMonthYear: Joi.string().min(5).max(50),
        isEnrolled: Joi.boolean(),
        city: Joi.string().min(5).max(60),
        state: Joi.string().min(2).max(15)
    };

    return Joi.validate(education, schema);
}

function validateCertification(certification){

    let schema={
        title: Joi.string().min(3).max(60).required(),
        organization: Joi.string().min(3).max(60).required(),
        issuedMonthYear: Joi.string().min(5).max(50).required(),
        expMonthYear: Joi.string().min(5).max(50),
        certificationID: Joi.string().min(5).max(50),
        links:Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150).optional(),
        canExpire: Joi.boolean().optional()
    };

    return Joi.validate(certification, schema);
}

function validateHonorsAwards(award){

    let schema={
        title: Joi.string().min(3).max(60).required(),
        association: Joi.string().min(5).max(100).required(),
        issuer: Joi.string().min(3).max(60).required(),
        issuedMonthYear: Joi.string().min(5).max(50).required(),
        links: Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150)
     
    };

    return Joi.validate(award, schema);
}


const educationSchema=new Mongoose.Schema({

    user: { type: Mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    school: {type: String, required: true},
    degree: {type: String, required: true},
    major: {type: String, required: true},
    gradMonthYear: {type: String, required: false},
    date: {type: Date, default: Date.now}

});

const experienceSchema=new Mongoose.Schema({

    user: { type: Mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    position: {type: String, required: true},
    company: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    from: {type: String, required: true},
    to: {type: String, required: true},
    links: {type: String, default:""},
    description: {type: String, required: true},
    date: {type: Date, default: Date.now}


});

const certificationSchema=new Mongoose.Schema({

    user: { type: Mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
        organization: {type: String, required: true},
        issuedMonthYear: {type: String, required: true},
        expMonthYear: {type: String, required: true} ,
        certificationID: {type: String, required: true},
        links: {type: String, default:""},
        description: {type: String, required: true},
        date: {type: Date, default: Date.now}

});

const honorsAwardSchema=new Mongoose.Schema({

    user: { type: Mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
        association: {type: String, required: true},
        issuedMonthYear: {type: String, required: true},
        year: {type: String, required: true},
        links: {type: String, default:""},
        description: {type: String, required: true},
        date: {type: Date,  default: Date.now}

});

const EducationModel=Mongoose.model("Education", educationSchema);
const ExperienceModel=Mongoose.model("Experience", experienceSchema);
const CertificationModel=Mongoose.model("Certification", certificationSchema);
const HonorAwardModel=Mongoose.model("HonorAwards", honorsAwardSchema);


exports.validateUser= validateUser;
exports.validateUserName= validateUserName;
exports.validateDreamJob=validateDreamJob;
exports.validateSkill=validateSkill;
exports.validateExperience=validateExperience;
exports.validateEducation=validateEducation;
exports.validateSocialMedia=validateSocialMedia;
exports.validateCertification=validateCertification;
exports.validateHonorsAwards=validateHonorsAwards;
//exports.validateUser= validateUser;
exports.User= UserModel;
exports.Education= EducationModel;
exports.Experience= ExperienceModel;
exports.Certification= CertificationModel;
exports.HonorAward= HonorAwardModel;
