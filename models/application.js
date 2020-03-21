const Mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');

//const phoneJoi = Joi.extend(require('joi-phone-number'));



//Create User Schema before feeding it into the Model object

const brandSchema=new Mongoose.Schema({

    brandName: {type :String, required: true},
    firstName: {type :String, required: true},
    lastName: {type :String, required: true},
    email: {type :String, required: true},
    website: {type :String, required: true},
    status:{type: String, default: "pending"},
	date :{type: Date, default: Date.now}

},

{
	collection: 'Brand Application',
  
});

const contribSchema=new Mongoose.Schema({

},

{
	collection: 'Contributor Application',
  
});


const discoverySchema=new Mongoose.Schema({

    diagnosticReport: {type :Object, required: true},
    competitorAudit: {type :Object, required: true},
    contentAudit: {type :Object, required: true},
    conusmerAudit:{type :Object, required: true},
    brandName: {type :String, required: true},
    email: {type :String, required: true},
    status:{type: String, default: "pending"},
    tier: {type: String, required: true, default: "1"},
	date :{type: Date, default: Date.now}
},

{
	collection: 'Brand Discovery Form',
  
});


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

const brandApp= Mongoose.model("Brand Application", brandSchema);
const discForm= Mongoose.model("Brand Discovery Form", discoverySchema);

exports.brandApp= brandApp;
exports.discForm= discForm;
exports.validateBrand= validateBrand;
exports.validateDiagnosticReport =validateDiagnosticReport;
exports.validateCompetitorAudit= validateCompetitorAudit;
exports.validateConsumerAudit= validateConsumerAudit;
exports.validateContentAudit= validateContentAudit;