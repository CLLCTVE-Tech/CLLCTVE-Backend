const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//store feed ID's for every brand added to the platform
mongoose.Promise = global.Promise;

var insightSchema= new mongoose.Schema({

	user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
	feedID: { type: String, required: true},
	date: {type: Date, required: true, default: Date.now},
	createdBy: {type: Schema.Types.ObjectId, required: true, ref: 'User'}
  },
  {
	collection: 'Insight Feeds',
  });
  
var InsightFeed= mongoose.model('Insights', insightSchema);

exports.InsightFeed = InsightFeed;