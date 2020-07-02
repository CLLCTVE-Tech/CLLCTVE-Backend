const mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');
const Schema=mongoose.Schema;

//const phoneJoi = Joi.extend(require('joi-phone-number'));


const baseOptions = {
    discriminatorKey: 'type',
    collection: 'Users'
}
//Create User Schema before feeding it into the Model object

const baseSchema=new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    email: {type :String, required: true},
    status:{type: String, required: true, default: "pending"},
    date :{type: Date, default: Date.now}
    
});

const BaseApplication= mongoose.model("Applications", baseSchema);


//we generate discriminators for:
//brand applications
//discovery form applications
//contributor applications
//jobs and gigs

const brandApp= BaseApplication.discriminator("Brand_app",
    new mongoose.Schema({
        brandName: {type :String, required: true},
        firstName: {type :String, required: true},
        lastName: {type :String, required: true},
        website: {type :String, required: true}
    })
);

const discForm= BaseApplication.discriminator("Discovery_app",
    new mongoose.Schema({
        diagnosticReport: {type :Object, required: true},
        competitorAudit: {type :Object, required: true},
        contentAudit: {type :Object, required: true},
        conusmerAudit:{type :Object, required: true},
        brandName: {type :String, required: true},
        email: {type :String, required: true},
        status:{type: String, default: "pending"},
        tier: {type: String, required: true, default: "1"},
        date :{type: Date, default: Date.now}

    })
);

const contribForm = BaseApplication.discriminator("Contributor_app",
    new mongoose.Schema({

    })

);


const jobApp= BaseApplication.discriminator("Jobs_app",
    new mongoose.Schema({

        jobID: { type: Schema.Types.ObjectId, required: true}
        
    })
);

const gigApp= BaseApplication.discriminator("Gigs_app",
    new mongoose.Schema({
        
        
    })
);

const skillApp= BaseApplication.discriminator("Skills_app",
    new mongoose.Schema({

        skill: {type: Schema.Types.ObjectId, required: true}
    })
);



function validateBrand(brand){
    schema={
        brandName: Joi.string().min(3).max(50).required(),
        firstName: Joi.string().min(3).max(50).required(),
        lastName: Joi.string().min(3).max(50).required(),
        email: Joi.string().min(8).max(255).required().email(),
        website: Joi.string().min(8).max(255).required()
    };

    return Joi.validate(brand, schema);
};


function validateDiagnosticReport(report){
    schema={

    };

    return Joi.validate(report, schema)
};

function validateCompetitorAudit(report){
    schema={

    };

    return Joi.validate(report, schema)
};

function validateContentAudit(report){
    schema={

    };

    return Joi.validate(report, schema)
};

function validateConsumerAudit(report){
    schema={

    };

    return Joi.validate(report, schema)
};

exports.jobApp= jobApp;
exports.skillApp= skillApp;
exports.BaseApplication= BaseApplication;
exports.brandApp= brandApp;
exports.discForm= discForm;
exports.validateBrand= validateBrand;
exports.validateDiagnosticReport =validateDiagnosticReport;
exports.validateCompetitorAudit= validateCompetitorAudit;
exports.validateConsumerAudit= validateConsumerAudit;
exports.validateContentAudit= validateContentAudit;
