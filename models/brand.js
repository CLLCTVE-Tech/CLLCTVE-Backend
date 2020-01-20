const Mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');

//Create User Schema before feeding it into the Model object

const brandSchema=new Mongoose.Schema({
    name:{
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },

    firstName:{
        type: String,
        required: false,
        minlength: 5,
        maxlength: 50
    },

    lastName:{
        type: String,
        required: false,
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

    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 2048
    },

    about:{
        type: String,
        required: false,
        minlength: 8,
        maxlength: 1024
    },

    location:String,

    discovery:[String],

    profilePic:{
        data: Buffer,
        contentType:String

    },
    media:{
        data:[Buffer]
    },
    following: {type: Number, default:0,},
    followers: {type: Number, default:0},
    tweetCount: {type: Number, default:0},
    posts:[Object],

});

//We have generated webtokens for each user in different files (auth and users), however,
//it would be easier to just create a function that generates a web token from the user model each time.
//we can create fucntions with the user model using mongoose!

brandSchema.methods.generateAuthToken = function() {
    const token=jwt.sign({id:this._id, isAdmin: this.isAdmin}, config.get('jwtPrivateKey'));
    return token;
};

const BrandModel=Mongoose.model("Brand", brandSchema);

function validateBrand(brand){
    schema={
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(8).max(255).required().email(),
        password: Joi.string().min(8).max(255).required(),
    };

    return Joi.validate(brand, schema);
};

//Lets export the information we want to make use of.

exports.validate= validateBrand;
exports.Brand= BrandModel;
