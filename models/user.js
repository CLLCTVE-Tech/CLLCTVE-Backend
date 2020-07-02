const mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');
const Schema= mongoose.Schema;
const {Role}= require('./role')
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
        minlength: 8,
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

/*baseSchema.methods.generateAuthToken = function() {
    const token=jwt.sign({id:this._id}, config.get('jwtPrivateKey'));
    return token;
};*/

//preferred function
baseSchema.methods.generateAuthToken = async function() {

    let admin=false;
    let contributor=false;

    let roles= await Role.find({user: this._id});

    //check for various roles
    if (roles){
    roles.forEach( async (_role, index) =>{
        
        if (_role.role_type=="Admin") admin=true;
        if (_role.role_type=="Contributor") contributor=true;
    })
    }

    const token=jwt.sign({id:this._id,type: this.type, role: {admin: admin, contributor: contributor},
    }, config.get('jwtPrivateKey'), {expiresIn: '1d'});

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
        startDate: String,
        endDate: String,
        description: String,
        currentlyWorking: Boolean
    }],

    education:[{
        school: String,
        major: String,
        degree:String,
        startMonthYear: String,
        gradMonthYear: String,
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

function validatePassword(password){
    var regularExpression= /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    return regularExpression.test(password);
}

function validateUser(user){
    schema={
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        phone: Joi.string().allow('').optional().max(10),
        email: Joi.string().min(8).max(255).required().email(),
        password: Joi.string().min(8).max(255).required(),
        
    };

    return Joi.validate(user, schema);
};

function validateBrand(user){
    schema={
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        phone: Joi.string().allow('').optional().max(15),
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

    let schema={
        title: Joi.string().min(3).max(60).required(),
        company: Joi.string().min(3).max(60).required(),
        city: Joi.string().min(5).max(60).optional(),
        state: Joi.string().min(2).max(15).optional(),
        startDate: Joi.string().min(5).max(50).required(),
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


const educationSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    school: {type: String, required: true},
    degree: {type: String, required: true},
    major: {type: String, required: true},
    startMonthYear: {type: String, required: false},
    gradMonthYear: {type: String, required: false},
    isEnrolled: {type: Boolean, required: false},
    city: {type: String, required: false},
    state: {type: String, required: false},
    date: {type: Date, default: Date.now}

});



const experienceSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    company: {type: String, required: true},
    city: {type: String, required: false},
    state: {type: String, required: false},
    startDate: {type: String, required: true},
    endDate: {type: String, required: false},
    description: {type: String, required: true},
    currentEmployer: {type: Boolean, required: false},
    date: {type: Date, defualt: Date.now} 

});

const certificationSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {type: String, required: true},
    organization: {type: String, required: true},
    issuedMonthYear: {type: String, required: true},
    expMonthYear: {type: String, required: false},
    certificationID: {type: String, required: true},
    links: {type: String, default:""},
    description: {type: String, required: true},
    canExpire: {type: Boolean, required: false},
    date: {type: Date, defualt: Date.now} 

});

const honorsAwardSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User'},
    title: {type: String, required: true},
    association: {type: String, required: true},
    issuer: {type: String, required: true},
    issuedMonthYear: {type: String, required: true},
    links: {type: String, default:""},
    description: {type: String, required: true},
    date: {type: Date,  defualt: Date.now} 
    

});

const Education=mongoose.model("Education", educationSchema);
const Experience=mongoose.model("Experience", experienceSchema);
const Certification=mongoose.model("Certification", certificationSchema);
const HonorAward=mongoose.model("Honor Awards", honorsAwardSchema);

exports.validatePassword=validatePassword;
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
