const {google} = require('googleapis');
const path = require('path')
const service_account = require(path.join(__dirname, './analyticsKeys.json'));
const analytics = google.analytics('v3');
const config= require('config');

let scopes = ['https://www.googleapis.com/auth/analytics.readonly'];

let jwt = new google.auth.JWT(
    service_account.client_email, 
    null, 
    service_account.private_key, 
    scopes
);

let viewId = config.get('analyticsViewId');


//possible list of metrics could be: ['ga:users','ga:sessions','ga:pageviews']
//must all have ga: in front of them and that is the purpose of the clean metric function.


//this will be a function used to gather a ton of metrics.
async function getMetric(metric, startDate, endDate) {
    await setTimeout[Object.getOwnPropertySymbols(setTimeout)[0]](
      Math.trunc(1000 * Math.random()),
    ); // 3 sec
    const result = await analytics.data.ga.get({
      auth: jwt,
      ids: `ga:${viewId}`,
      'start-date': startDate,
      'end-date': endDate,
      metrics: metric,
    });
    const res = {};
    res[metric] = {
      value: parseInt(result.data.totalsForAllResults[metric], 10),
      start: startDate,
      end: endDate,
    };
    return res;
}


//this function will clean up metrics if necessary
function parseMetric(metric) {
    let cleanMetric = metric;
    if (!cleanMetric.startsWith('ga:')) {
      cleanMetric = `ga:${cleanMetric}`;
    }
    return cleanMetric;
  }

  //This function will get all the data we need
  function getData(metrics = ['ga:users'], startDate = '30daysAgo', endDate = 'today') {
    // ensure all metrics have ga:
    const results = [];
    for (let i = 0; i < metrics.length; i += 1) {
      const metric = parseMetric(metrics[i]);
      results.push(getMetric(metric, startDate, endDate));
    }
    return results;
  }





module.exports=getData;
