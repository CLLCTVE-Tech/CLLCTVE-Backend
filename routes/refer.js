var express = require('express'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    auth= require('../middleware/auth'),
    router = express.Router(),
    config=require('config');

//Twilio Account credentials
const accountSid = config.get("twilAccountSid");
const authToken = config.get("twilAuthToken");

const TwilioClient = require('twilio')(accountSid, authToken);


    /******************
      Refer other Users
    ******************/

router.get('/', auth, (req,res)=>{

try{

    return res.status(200).send("How would you like to refer your friend? By Phone or by Email?")

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});

router.post('/email',auth ,(req, res) => {

try{

    const transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
          user: config.get("emailUser"),
          pass: config.get("emailPass")
        }
      }));
  
  var mailOptions = {
    from: config.get("emailUser"),
    to: req.body.email,
    subject: 'CLLCTVE Referral',
    text: 'This is an automated email. Hey ' + req.body.email + ' you were referred by a friend to join CLLCTVE. Check it out at cllctve.com .'
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      return res.status(500).send("There was a problem trying to send the email")
    } else {
      console.log('Email sent: ' + info.response);
      return res.status(200).send('Email sent: ' + info.response)
    }
  });

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

});


router.post('/phone',auth ,(req, res) => {

try{

    TwilioClient.messages
  .create({
     body: 'Hey you were referred to CLLCTVE by a friend. Check it out at: cllctve.com',
     from: config.get("twilNumber"), //this is our trial number
     to: '+1' + req.body.number
   })
  .then(message => console.log(message.sid));

  return res.status(200).send("Successfully Sent phone message");

}

catch(error){

    console.error(error);
    return res.status(500).send("Sorry an error occured please try again later.");

}

 });

 module.exports =router;