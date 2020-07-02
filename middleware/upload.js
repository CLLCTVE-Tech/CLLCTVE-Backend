const config = require('config');
const multer = require('multer');
const multerGoogleStorage = require("multer-google-storage");
const {storage} = require('../cloud/config/storage');
const util=require('util');
const lodash=require('lodash');


//multer uploadhandler
var uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    // no larger than 5mb.
    fileSize: 5 * 1024 * 1024,
  },
})

//var uploadSingleFile = uploadHandler.single('file');
var uploadMultipleFiles=uploadHandler.array('files', 10);
//var uploadSingleFileMiddleware = util.promisify(uploadSingleFile);
var uploadFilesMiddleware = util.promisify(uploadMultipleFiles);


// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
// [START public_url]
function getPublicUrl (filename,bucket) {
  return `https://storage.googleapis.com/${bucket}/${filename}`;
}
// [END public_url]


//functions to check if a user bucket exists
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

async function bucketExists(BUCKET_NAME){

const bucket_list=await listBuckets();
var bucketIsThere = lodash.filter(bucket_list, bucket => bucket.metadata.id === BUCKET_NAME);
if (bucketIsThere.length===0){
    console.log("Bucket does not exist, now creating bucket");
    await createBucket(BUCKET_NAME);
    console.log("Bucket created successfully");
}

}


// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
// [START process]

async function sendUploadsToGCS (req, res, next) {
  if (!req.files) {
    console.log("There are no files")
    return next()
  }

  //console.log(req.files)

  //create bucket if it isn't present.
  //await bucketExists(req.user.id);

  //await listBuckets();

  const CLOUD_BUCKET = req.user.id;

  
  const bucket = storage.bucket(CLOUD_BUCKET);

  await bucketExists(CLOUD_BUCKET);

  let promises = [];
  let fileURLs=[];
  let vals = Object.values(req.files);


  for(let f of req.files){
    
    const gcsname = req.type +'/'+Date.now() + f.originalname
    const file = bucket.file(gcsname)

    const stream = file.createWriteStream({
      metadata: {
        contentType: f.mimetype
      },
      resumable: false
    })

    stream.on('error', (err) => {
      f.cloudStorageError = err
      console.log(f)
      next(err)
    })
    stream.end(f.buffer)

    promises.push(
      new Promise ((resolve, reject) => {
        stream.on('finish', () => {
          f.cloudStorageObject = gcsname;
          file.makePublic().then(() => {
            f.cloudStoragePublicUrl = getPublicUrl(gcsname, CLOUD_BUCKET)
            fileURLs.push(f.cloudStoragePublicUrl);
            resolve()
          })
        })
      })
    )
  }
  req.fileURLs= fileURLs;
  Promise.all(promises).then(() => next())
}



/*
async function sendUploadToGCS (req, res, next) {

  if (!req.file) {
    console.log("There's no file")
    return next();
  }

  const CLOUD_BUCKET = req.user.id;

  await bucketExists(CLOUD_BUCKET);

  const bucket = storage.bucket(CLOUD_BUCKET);

  const gcsname = req.type +'/'+ Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    },
    resumable: false
  });

  stream.on('error', (err) => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', async () => {
    req.file.cloudStorageObject = gcsname;
    await file.makePublic().then(() => {
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });
  });

  stream.end(req.file.buffer);

  return next();
}

*/
// [END process]

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
// [START multer]
/*const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});
// [END multer]
*/

module.exports = {
  sendUploadsToGCS,
  uploadFilesMiddleware
};