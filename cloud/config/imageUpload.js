const util = require('util')
const {storage} = require('./storage')
const lodash=require('lodash');


    async function listBuckets() {
        // [START storage_list_buckets]
        // Imports the Google Cloud client library
        
        // Lists all buckets in the current project
        const [buckets] = await storage.getBuckets();
        return buckets;
        };
        // [END storage_list_buckets]
      

    async function createBucket(bucketName) {
        // Creates the new bucket
        await storage.createBucket(bucketName);
        console.log(`Bucket ${bucketName} created.`);
      }

    async function bucketExists(bucketName){

      const bucket_list=await listBuckets();
      var bucketIsThere = lodash.filter(bucket_list, bucket => bucket.metadata.id === bucketName);
      if (bucketIsThere.length===0){
          console.log("Bucket does not exist, now creating bucket");
          await createBucket(bucketName);
          console.log("Bucket created successfully");
      }
    };



// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
// [START public_url]
function getPublicUrl (filename,bucketName) {
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
}
// [END public_url]

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
// [START process]

async function imageUpload(filename,type, bucketName) {

  try{

    //create bucket if it isn't present.
    await bucketExists(bucketName);

    const bucket = storage.bucket(bucketName);
  
    const gcsname = type +'/'+Date.now() + filename.originalname;
    const file = bucket.file(gcsname);
  
    const stream = file.createWriteStream({
      metadata: {
        contentType: filename.mimetype,
      },
      resumable: false,
    });

    
  
    stream.on('error', err => {
      filename.cloudStorageError = err;
      console.log(err);
    });
  
    stream.on('finish', async () => {
      
      filename.cloudStorageObject = gcsname;
      await file.makePublic().then(() => {
        imageUrl = getPublicUrl(gcsname,bucketName);
        console.log(imageUrl);
      });
    

    });
  
    stream.end(filename.buffer);
    return getPublicUrl(gcsname,bucketName);

  }

  catch(error){
    console.log(error);
  
  }
  // [END process]

}
  
  exports.imageUpload=imageUpload;

