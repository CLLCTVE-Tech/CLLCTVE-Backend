const mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');


const tokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    //expires after 43200 seconds, document deletes itself after 12 hours
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});

const Token= new mongoose.model('Verficiation Token', tokenSchema);

exports.Token=Token;