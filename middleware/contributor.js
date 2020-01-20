module.exports= function(req, res,next){
    //if the users isn't the a contributor, return the following 403 error status
    if (!req.user.isContributor) return res.status(403).send("Error, Forbidden Action. You are not a Contributor to this platform");

    next();
}