require('dotenv/config');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');
AWS.config.update({region: 'us-east-1'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

exports.handler = (event, context) => {
    if(event){
        if(!event.body){
            event.body = {};
        }else if(typeof event.body === 'string'){
            event.body = JSON.parse(event.body);
        }
    }
    const required = ['contact', 'email'].filter((property) => !event.body[property]);
    if(required.length > 0){
        return Promise.reject({
            statusCode: 400,
            message: `Required properties missing: "${required.join('", "')}".`
        });
    }

    var params = {
        TableName: 'contact-us',
        Item: {
            email: {S: event.body.email.length > 1000 ? event.body.email.substring(0, 999) : event.body.email},
            rangekey: {S: new Date() + uuidv4()},
            message: {S: event.body.contact.length > 1000 ? event.body.contact.substring(0, 999) : event.body.contact},
            received: {S: new Date().toString()}
        }
    };
    
    ddb.putItem(params, function(err, data) {
        if (err) {
            return context.succeed({
                statusCode: 200,
                body: err,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,XAmz-Security-Token',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            let returnObject = {'message': 'Your message was successfully received!'};
            return context.succeed({
                statusCode: 200,
                body: JSON.stringify(returnObject),
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,XAmz-Security-Token',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    });
}