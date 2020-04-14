const mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');
const Schema= mongoose.Schema;
//const phoneJoi = Joi.extend(require('joi-phone-number'));

//add discriminator so we can control user level access
//as well as role based autorization

const baseOptions = {
    discriminatorKey: 'type',
    collection: 'Users'
}

//Create User Schema before feeding it into the Model object

const baseSchema=new mongoose.Schema({

    username:{
        type: String,
        minlength: 3,
        maxlength: 50
    },

    firstName:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },

    lastName:{
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },

    email:{
        type: String,
        required: true,
        minlength: 8,
        maxlength: 255,
        unique: true //prevents same email from being stored
    },

    phone:{
        type: String,
        required: false, 
        minlength: 10,
        maxlength: 50
    },

    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    },

    about:{
        type: String,
        required: false,
        minlength: 5,
        maxlength: 500
    },

    isVerified: {type:Boolean, default: false},
    isActive: {type: Boolean, default: false},

    following: {type: Number, default:0,},
    followers: {type: Number, default:0},
    tweetCount: {type: Number, default:0},

    profilePic: {type:Array, default: []},
    backgroundPic: {type:Array, default: []},

    socialMediaHandles: {
        type: Map,
        of: String
      },

    joined: {type: Date, default: Date.now}
},
    //discriminator field
    baseOptions
)

baseSchema.methods.generateAuthToken = function() {
    const token=jwt.sign({id:this._id}, config.get('jwtPrivateKey'));
    return token;
};

const BaseUser=mongoose.model("Users", baseSchema);

const User= BaseUser.discriminator("User",
    new mongoose.Schema({
        gradMonthYear: {type: String, required: false},

    
    resume: {type:Array, default: []},
    portfolio: {type:Array, default: []},

   
    dreamJobs: {type:Array, default: []},

    skills: {type:Array, default: []},

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
        degree:String,
        from: String,
        to: String,
        currentlyAttending: Boolean
    }],

    honorsAwards: [{
        title: String,
        association: String ,
        issuer: String,
        month: String,
        year: String,
        links: String,
        description: String
    }],

    certifications: [{
        title: String,
        organization: String,
        issuedMonth: String,
        issuedYear: String,
        expMonth: String,
        expYear: String,
        certificationID: String,
        links: String,
        description: String 
    }],
    
    onboarded: {type: Boolean, default: false}

    })  
);

const Brand= BaseUser.discriminator("Brands",

    new mongoose.Schema({
    website: {type: String, required: false},
    //this will determine membership
    membership:{type: String, required: true, default: 'normal'},

    })
);


//We have generated webtokens for each user in different files (auth and users), however,
//it would be easier to just create a function that generates a web token from the user model each time.
//we can create fucntions with the user model using mongoose!

function validateUser(user){
    schema={
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        phone: Joi.string().allow('').optional().max(10),
        email: Joi.string().min(8).max(255).required().email(),
        password: Joi.string().min(8).max(255).required(),
        gradMonthYear: Joi.string().min(5).max(50).required(),
    };

    return Joi.validate(user, schema);
};

function validateBrand(user){
    schema={
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        phone: Joi.string().allow('').optional().max(10),
        email: Joi.string().min(8).max(255).required().email(),
        password: Joi.string().min(8).max(255).required()
    };

    return Joi.validate(user, schema);
};

function validateDreamJob(job){
    
    schema={
        dreamJob: Joi.string().min(5).max(50).required()
    };

    return Joi.validate(job, schema);
};

function validateSkill(skill){
    schema={
        skill: Joi.string().min(3).max(50)
    };
    return Joi.validate(skill, schema);
        
};

function validateSocialMedia(socialMedia){

    schema={
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
   
    schema={
        title: Joi.string().min(5).max(60).required(),
        company: Joi.string().min(3).max(60).required(),
        from: Joi.string().min(2).required(),
        to: Joi.string().min(2).required(),
        description: Joi.string().min(15).max(200).required()
    };

    if (userExperience.currentlyWorking==true) schema.to=Joi.date().string();

    return Joi.validate(userExperience, schema);
}


function validateEducation(education){
    
    schema={
        school: Joi.string().min(5).max(60).required(),
        major: Joi.string().min(5).max(60).required(),
        degree: Joi.string().min(3).max(60).required(),
        from: Joi.string().min(5).required(),
        to: Joi.string().min(4).required()
    }

    return Joi.validate(education, schema);
}

function validateCertification(certification){

    schema={
        title: Joi.string().min(5).max(60).required(),
        organization: Joi.string().min(5).max(60).required(),
        from: Joi.string().min(2).required(),
        to: Joi.string().min(2).required(),
        certificationID: Joi.string().min(5).max(50).required(),
        links:Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150)
    }

    return Joi.validate(certification, schema);
}

function validateHonorsAwards(award){

    schema={
        title: Joi.string().min(5).max(60).required(),
        association: Joi.string().min(5).max(100).required(),
        issuer: Joi.string().min(3).max(60).required(),
        from: Joi.string().min(2).required(),
        links: Joi.string().allow('').optional().max(150),
        description: Joi.string().min(20).max(150)
     
    }

    return Joi.validate(award, schema);
}


const educationSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    school: {type: String, required: true},
    degree: {type: String, required: true},
    major: {type: String, required: true},
    to: {type: String, required: true},
    from: {type: String, required: true},
    currentlyAttending: {type: Boolean, required: false},
    date: {type: Date, defualt: Date.now} 

});

const experienceSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    company: {type: String, required: true},
    from: {type: String, required: true},
    to: {type: String, required: true},
    description: {type: String, required: true},
    currentlyWorking: {type: Boolean, required: false},
    date: {type: Date, defualt: Date.now} 


});

const certificationSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    organization: {type: String, required: true},
    from: {type: String, required: true},
    to: {type: String, required: true},
    certificationID: {type: String, required: true},
    links: {type: String, default:""},
    description: {type: String, required: true},
    date: {type: Date, defualt: Date.now} 

});

const honorsAwardSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    association: {type: String, required: true},
    issuer: {type: String, required: true},
    from: {type: String, required: true},
    links: {type: String, default:""},
    description: {type: String, required: true},
    date: {type: Date,  defualt: Date.now} 

});

const Education=mongoose.model("Education", educationSchema);
const Experience=mongoose.model("Experience", experienceSchema);
const Certification=mongoose.model("Certification", certificationSchema);
const HonorAward=mongoose.model("Honor Awards", honorsAwardSchema);


exports.validateUser= validateUser;
exports.validateBrand= validateBrand;
exports.validateDreamJob=validateDreamJob;
exports.validateSkill=validateSkill;
exports.validateExperience=validateExperience;
exports.validateSocialMedia=validateSocialMedia;
exports.validateEducation=validateEducation;
exports.validateCertification=validateCertification;
exports.validateHonorsAwards=validateHonorsAwards;

exports.BaseUser=BaseUser;
exports.Brand= Brand;
exports.User= User;
exports.Education=Education;
exports.Experience= Experience;
exports.Certification= Certification;
exports.HonorAward= HonorAward;
