const jwt= require('jsonwebtoken');
const config = require('config');

//lets create a middleware function that authenticates a user given a token
//we can use this to protect routes, we simply add it as the second argument in our routes functions
module.exports=function(req, res, next){

    token=req.header('x-auth-token');
    if(!token) res.status(401).send("Access denied, no token provided.");

    //if there is a token, we need to verify that this is a valid token.
    try{
        const decoded=jwt.verify(token, config.get('jwtPrivateKey'));
        //we can set the req of the user object to the decoded json token
        req.user=decoded;
        //since this is a middleware function, we have to pass control to the next middleware
        next();
    }

    catch(ex){
        res.status(400).send("Invalid Token.");
    }
}