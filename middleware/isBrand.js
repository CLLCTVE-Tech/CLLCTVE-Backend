module.exports= function(req, res,next){
    //if the users isn't the admin, return the following 403 error status
    if (!req.user.isBrand) return res.status(403).send("Error, Forbidden Action. You are not a Brand on this platform");

    next();
}