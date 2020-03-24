
const express= require('express');
const router= express.Router();
const logger=require('./logger');

router.get("/", async (req, res) => {

    try{
    console.log('status endpoint reached');
    logger.info("status endpoint reached");
    return res.status(200).json({ status: 'ok' });
    }

    catch(error){
        console.error(error);
        logger.error({message:"The server is not responding", error:error})
        return res.status(500).send("The server is not responding")  
    }

});

module.exports=router;