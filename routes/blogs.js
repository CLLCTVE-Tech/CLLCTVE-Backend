const {Blog, validatePost, uploadBlogImage}= require('../models/blog');
const {User}= require('../models/user');
const auth=require("../middleware/auth");
const admin = require('../middleware/admin');
const contributor=require("../middleware/contributor");

const express= require('express');
router=express.Router();


const {imageUpload}= require('../cloud/config/imageUpload');


//code to display a blog post by its id, will be moved later

router.get('/', async (req, res) => {

    try{
    //THIS RETURNS ALL POSTS
    //we should add a loop to get the title of each blog
    const posts = await Blog
    .find({})
    .sort({'date': -1})
    .limit(50);

    return res.status(200).send(posts);

    } catch(error){
        
        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
});  

router.get('/post/:id', async (req, res) => {
    try{
    const post = await Blog.findById(req.params.id)
    return res.status(200).send(post);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };
}); 


//store new blog posts to MongoDB
router.post('/create', [auth], async (req, res) => {

    try{

    console.log(req.body);
    
    //get current user
    const current_user=await User.findOne(req.user._id).select("-password");
    console.log(req.body);
    const {error}= validatePost(req.body);
    //if (error) return res.status(404).send(error.details[0].message);

    console.log(current_user);

    if (req.file){

        //check if number of images is greater than 4
        /*if (req.files.length >4)
        var range=4
        else
        var range= req.files.length
        */
        
        var uploads= await imageUpload(req.file, 'blog', req.user.id);
    
        console.log(req.file)
    }

    post =new Blog({
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        authors: req.body.authors,
        content: req.body.content,
        imageUrls: uploads

    });

    await post.save();
    return res.status(200).send(post);

    } catch(error){

        console.error(error);
        return res.status(500).send("Sorry an error occured please try again later.");
    };

}); 

//display all the blog posts in MongoDB

module.exports = router;
 

