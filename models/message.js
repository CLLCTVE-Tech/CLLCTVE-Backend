const mongoose = require('mongoose');
const {User}=require('./user');
Schema=mongoose.Schema;

const messageSchema= new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    target: { type: Schema.Types.ObjectId, required: true, ref: 'User'},
    name: {type: String, required: false},
    message: {type : String, required: true}
});

const Message= new mongoose.model('Messages', messageSchema);

module.exports={Message: Message};

