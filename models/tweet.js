var mongoose = require('mongoose'),
//config = require('./config/config'),
_ = require('underscore'),
Schema = mongoose.Schema,
stream_node = require('getstream-node');
const {User} = require('./user');
const {Brand}=require('./brand');

mongoose.Promise = global.Promise;


var FeedManager = stream_node.FeedManager;
var StreamMongoose = stream_node.mongoose;



var messageSchema= new mongoose.Schema({

  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  target: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  name: {type: String, required: false},
  message: {type : String, required: true},
  date :{type: Date, default: Date.now}
},
{
  collection: 'Messages',
});

messageSchema.plugin(StreamMongoose.activity);

messageSchema.methods.activityNotify = function() {
	target_feed = FeedManager.getNotificationFeed(this.target._id);
	return [target_feed];
};

messageSchema.methods.activityForeignId = function() {
	return this.user._id + ':' + this.target._id;
};

messageSchema.statics.pathsToPopulate = function() {
	return ['user', 'target'];
};

const Message= new mongoose.model('Messages', messageSchema);


var mentionSchema= new mongoose.Schema({

	user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	target: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	tweet: {type: Schema.Types.ObjectId, required: true, ref: 'Tweet'},
	imageUrls: {type:Array, requred:false, default:[]},
	date :{type: Date, default: Date.now}
  },
  {
	collection: 'Mentions',
  });

mentionSchema.plugin(StreamMongoose.activity);

mentionSchema.methods.activityNotify = function() {
	target_feed = FeedManager.getNotificationFeed(this.target._id);
	return [target_feed];
};

mentionSchema.methods.activityForeignId = function() {
	return this.user._id
};

mentionSchema.statics.pathsToPopulate = function() {
	return ['user', 'tweet'];
};

const Mentions= new mongoose.model('Mentions', mentionSchema);

var tagSchema= new mongoose.Schema({

	
	user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	name: {type :String, required: true},
	tweet: {type: Schema.Types.ObjectId, required: true, ref: 'Tweet'},
	date :{type: Date, default: Date.now}
  },
  {
	collection: 'Tags',
  });

tagSchema.plugin(StreamMongoose.activity);

tagSchema.methods.activityForeignId = function() {
	return this.user._id;
};

tagSchema.statics.pathsToPopulate = function() {
	return ['user', 'tweet'];
};

const Tag= new mongoose.model('Tags', tagSchema);


var tweetSchema = new Schema(
	{ 
    
		user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    image_url: { type: String, required: false },
    tweet:{ type: String, required: false},
    likes: { type: Number, default: 0 },
    date: {type: Date, default: Date.now},
    comments: {type: Number,  default:0}
	},
	{
		collection: 'Tweets',
	}
);


tweetSchema.plugin(StreamMongoose.activity);

tweetSchema.statics.pathsToPopulate = function() {
	return ['user'];
};

tweetSchema.methods.activityForeignId = function() {
	return this.user._id;
};

var Tweet = mongoose.model('Tweet', tweetSchema);


var likeSchema = new Schema(
	{ 
    
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    target: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	tweet:{ type: Schema.Types.ObjectId, required: true, ref: 'Tweet' },
	date :{type: Date, default: Date.now}
	},
	{
		collection: 'Likes',
	}
);

likeSchema.plugin(StreamMongoose.activity);

likeSchema.methods.activityNotify = function() {
	target_feed = FeedManager.getNotificationFeed(this.target._id);
	return [target_feed];
};

likeSchema.methods.activityForeignId = function() {
	return this.user._id + ':' + this.target._id;
};

likeSchema.statics.pathsToPopulate = function() {
	return ['user', 'target'];
};


var Like= mongoose.model('Likes', likeSchema);


var commentSchema = new Schema(
	{ 
    
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    target: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    tweet:{ type: Schema.Types.ObjectId, required: true, ref: 'Tweet' }, 
    comment: {type: Schema.Types.ObjectId, required:true, ref: 'Tweet'},
    date:{type: Date, required: true, default: Date.now}
	},
	{
		collection: 'Comments',
	}
);

commentSchema.plugin(StreamMongoose.activity);

commentSchema.methods.activityNotify = function() {
	target_feed = FeedManager.getNotificationFeed(this.target._id);
	return [target_feed];
};

commentSchema.methods.activityForeignId = function() {
	return this.user._id + ':' + this.target._id;
};

commentSchema.statics.pathsToPopulate = function() {
	return ['user', 'target'];
};

var Comment= mongoose.model('Comments', commentSchema); 

var followSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
		target: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
		date :{type: Date, default: Date.now}
	},
	{
		collection: 'Follow',
	}
);

followSchema.plugin(StreamMongoose.activity);

followSchema.methods.activityNotify = function() {
	target_feed = FeedManager.getNotificationFeed(this.target._id);
	return [target_feed];
};

followSchema.methods.activityForeignId = function() {
	return this.user._id + ':' + this.target._id;
};

followSchema.statics.pathsToPopulate = function() {
	return ['user', 'target'];
};

followSchema.post('save', function(doc) {
	if (doc.wasNew) {
		var userId = doc.user._id || doc.user;
		var targetId = doc.target._id || doc.target;
		FeedManager.followUser(userId, targetId);
	}
});

followSchema.post('remove', function(doc) {
	FeedManager.unfollowUser(doc.user, doc.target);
});

var Follow = mongoose.model('Follow', followSchema);


// send the mongoose instance with registered models to StreamMongoose
StreamMongoose.setupMongoose(mongoose);

module.exports = {
	Tweet: Tweet,
  Follow: Follow,
  Message: Message,
  Like: Like,
  Comment: Comment,
  Mentions: Mentions,
  Tag:Tag
};