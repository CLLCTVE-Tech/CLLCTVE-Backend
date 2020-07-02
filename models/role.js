const mongoose = require('mongoose');
const Joi =require('joi');
const jwt =require('jsonwebtoken');
const config = require('config');
const Schema= mongoose.Schema;
//const phoneJoi = Joi.extend(require('joi-phone-number'));

//add discriminator so we can control user level access
//as well as role based autorization

const baseOptions = {
    discriminatorKey: 'role_type',
    collection: 'Roles'
};

const Role = mongoose.model('Base', new mongoose.Schema({

    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' }},     
    baseOptions)
);

const Admin=Role.discriminator("Admin", new mongoose.Schema({}));
const Contributor=Role.discriminator("Contributor", new mongoose.Schema({}));

exports.Admin= Admin;
exports.Contributor=Contributor;
exports.Role=Role;