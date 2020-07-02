//set the directory we want to save images in when uploading to GCP

const Joi= require('joi');

module.exports= function setType(type) {
    return function(req, res, next) {
        try{
            req.type=type;
            next();
        }
    
        catch(ex){
            res.status(400).send("An error occurred");
        }
    }
  }