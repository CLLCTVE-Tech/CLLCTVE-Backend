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


var insightSchema= new mongoose.Schema({

	user: { type: Schema.Types.ObjectId, required: true, ref: 'Brand' },
	text: { type: String, required: true},
	url: {type: String, required: false},
	date: {type: Date, required: true, default: Date.now},
	consider: {type : String, default: 'waiting'}
  },
  {
	collection: 'Insights',
  });

insightSchema.plugin(StreamMongoose.activity);

insightSchema.methods.activityNotify = function() {
    
	target_feed = FeedManager.getNotificationFeed(this.user._id);
	return [target_feed];
};

insightSchema.methods.activityForeignId = function() {
	return this.user._id;
};

insightSchema.statics.pathsToPopulate = function() {
	return ['user'];
};
  
var Insight= mongoose.model('Insights', insightSchema);

StreamMongoose.setupMongoose(mongoose);

exports.Insight = Insight;