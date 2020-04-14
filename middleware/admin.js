const {Admin}= require('../models/role')

module.exports= async function(req, res,next){
    //if the users isn't the admin, return the following 403 error status
    const current_user=await Admin.findOne({user:req.user.id});
    console.log(current_user);
    if (!current_user) return res.status(403).send("Error, Forbidden Action.");
    next();
}