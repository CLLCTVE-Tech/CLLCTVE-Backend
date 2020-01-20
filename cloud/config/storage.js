const Cloud = require('@google-cloud/storage')
const path = require('path')
const serviceKey = path.join(__dirname, './storageKeys.json')
const config = require('config');

const { Storage } = Cloud
const storage = new Storage({
  keyFilename: serviceKey,
  projectId: config.get("gcpProjectId"),
})

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

exports.storage = storage;
exports.bucketExists=bucketExists;