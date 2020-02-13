const {User}= require('../models/user')

module.exports= async function(req, res,next){
    //if the users isn't the admin, return the following 403 error status
    const current_user=await User.findOne({_id:req.user.id}).select("-password");
    console.log(current_user);
    if (!current_user.isAdmin) return res.status(403).send("Error, Forbidden Action.");
    next();
}