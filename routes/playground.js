const extract = require('mention-hashtag')

 
const all = extract('Any text with #hashtag and ', 'all');
// all == { mentions: ['@mention', '@othermention'],

if (all.mentions.length ==0){
console.log('True')
}