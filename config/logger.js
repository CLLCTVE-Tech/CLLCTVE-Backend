const {createLogger, transports, format} =require('winston')
require('winston-mongodb');
const config= require('config');
const mongoose= require('mongoose');

const logger =createLogger({
    transports: [
        new transports.File({
            filename: "info.log",
            level: "info",
            format: format.combine(format.timestamp(), format.json())
        }),

        new transports.File({
            filename: "errors.log",
            level: "error",
            format: format.combine(format.timestamp(), format.json())
        }),

        new transports.MongoDB({
            level: 'error',
            db: config.get("mongoStringV2"),
            collection: 'Info Logs',
            format: format.combine(format.timestamp(), format.json())
            
        }),

        new transports.MongoDB({
            level: 'error',
            db: config.get("mongoStringV2"),
            collection: 'Error Logs',
            format: format.combine(format.timestamp(), format.json())
            
        })
    ]
})

module.exports= logger;
