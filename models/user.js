const Mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');



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

    //This is how we diffrentiate creatives from brands
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

    dreamJob: {
        type: String,
        required: false,
        minlength: 8,
        maxlength: 50
    },

    about:{
        type: String,
        required: false,
        minlength: 5,
        maxlength: 500
    },

    portfolio: {type:Array, default: []},

    achievements:{type:Array, default: []},

    //we can use this for role based authorization
    isAdmin: {type:Boolean, default: false},
    isContributor: {type:Boolean, default: false},
    blogPosts: {type:Array, default: []},
    isVerified: {type:Boolean, default: false},
    skills: {type:Array, default: []},
    isActive: {type: Boolean, default: false},

    experience:[{
        title: String,
        company: String,
        from: String,
        to: String,
        description: String,
        currentlyWorking: Boolean
    }],

    education:[{
        school: String,
        major: String,
        from: String,
        to: String,
        currentlyAttedning: Boolean
    }],

    //this will determine membership
    membership:{type: String, required: true, default: 'normal'},

    socialMediaHandles: {
        type: Map,
        of: String
      }

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
};

function validateUserName(userName){
    let schema={
        username: Joi.string().min(5).max(50).required()
    };
    return Joi.validate(userName, schema);
};

function validateDreamJob(job){
    
    let schema={
        dreamJob: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(job, schema);
};

function validateSkill(skill){
    let schema={
        skill: Joi.string().min(3).max(50)
    };
    return Joi.validate(skill, schema);
    
};

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
};

function validateExperience(userExperience){

    let schema={
        title: Joi.string().min(5).max(60).required(),
        company: Joi.string().min(5).max(60).required(),
        from: Joi.string().required(),
        to: Joi.string().required(),
        description: Joi.string().min(15).max(200).required(),
        currentlyWorking: Joi.boolean()
    };

    if (userExperience.currentlyWorking===true) schema.to=Joi.date().string();

    return Joi.validate(userExperience, schema, { convert: true, abortEarly: false });
}

function validateEducation(education){

    let schema={
        school: Joi.string().min(3).max(60).required(),
        degree: Joi.string().min(5).max(60).required(),
        major: Joi.string().min(5).max(60).required(),
        gradMonthYear: Joi.string().min(5).max(50).required(),
    }

    return Joi.validate(education, schema);
}

function validateCertification(certification){

    let schema={
        title: Joi.string().min(5).max(60).required(),
        organization: Joi.string().min(5).max(60).required(),
        issuedMonthYear: Joi.string().min(5).max(50).required(),
        expMonth: Joi.string().min(2).max(15).required() ,
        expYear:Joi.string().min(2).max(15).required(),
        certificationID: Joi.string().min(5).max(50).required(),
        links:Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150)
    }

    return Joi.validate(certification, schema);
}

function validateHonorsAwards(award){

    let schema={
        title: Joi.string().min(5).max(60).required(),
        association: Joi.string().min(5).max(100).required(),
        issuer: Joi.string().min(5).max(60).required(),
        issuedMonthYear: Joi.string().min(5).max(50).required(),
        links: Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150)
     
    }

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
const HonorAwardModel=Mongoose.model("Honor Awards", honorsAwardSchema);


exports.validateUser= validateUser;
exports.validateUserName= validateUserName;
exports.validateDreamJob=validateDreamJob;
exports.validateSkill=validateSkill;
exports.validateExperience=validateExperience;
exports.validateEducation=validateEducation;
exports.validateSocialMedia=validateSocialMedia;
//exports.validateUser= validateUser;
exports.User= UserModel;
exports.Education= EducationModel;
exports.Experience= ExperienceModel;
exports.Certification= CertificationModel;
exports.HonorAward= HonorAwardModel;
