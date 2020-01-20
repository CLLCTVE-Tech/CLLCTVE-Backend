var express = require('express'),
    models = require('../models/tweet'),
    {User}=require('../models/user'),
    auth= require('../middleware/auth'),
    router = express.Router(),
    http = require('http').Server(router),
    io = require('socket.io')(http),
    Message= models.Message;

    /******************
      Sending Messages
    ******************/

    //get messages
    router.get('/' ,auth ,async (req, res) => {

    try{

        messages= await Message
        .find({user: req.user.id})
        .sort({'date': -1})
        .limit(20); 

        return res.status(200).send(messages);

    }
    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
      });

    router.get('/thread/:id' ,async (req, res) => {

        try{
    
            messages= await Message
            .find({target: req.params.id})
            .sort({'date': -1})
            .limit(20);
            
            
            return res.status(200).send(messages);
            
    
        }
        catch(error){
    
            console.error(error);
            return res.status(500).send("Sorry an error occured please try again later.");
    
    }
          });
    
    //create a new message  
    router.post('/create', auth, async (req, res, next) => {

    try{

        console.log(req.body)

       await User.findOne({ _id: req.body.target}, function(err, target) {
            if (target) {
                var messageData = { user: req.user.id, message: req.body.message, target: req.body.target};
                var message = new Message(messageData);
                message.save(function(err) {
                    if (err) next(err);
                        res.set('Content-Type', 'application/json');
                        io.emit('message', messageData);
                        return res.status(200).send({ message: req.body.message });
                        });
                    }
            else return res.status(404).send('User Does not exist');
      });

    }

    catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");

}
    });

module.exports=router;