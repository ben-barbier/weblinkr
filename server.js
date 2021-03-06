'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

// Swagger
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');

// Database
const mongodb = require('mongodb').MongoClient;
const assert = require('assert');

let links;
mongodb.connect(process.env.MONGO_URI, function init(error, db) {
    assert.equal(null, error);
    console.log("Connected successfully to database");
    links = db.collection('links');
});

const linkSchema = Joi.object({
    title: Joi.string().required(),
    url: Joi.string().uri().required(),
    description: Joi.string().allow(''),
    tags: Joi.array().required().items(Joi.string()).min(1).unique()
});

// Create a server with a host and port
const server = new Hapi.Server({
    connections: {
        routes: {
            cors: true
        }
    }
});

server.connection({
    host: '0.0.0.0',
    port: process.env.PORT
});

// Add the route
server.route([{
    method: 'GET',
    path: '/links',
    handler: function (request, reply) {
        return links.find({}, {_id: 0}).toArray(function (err, docs) {
            reply(docs);
        });
    },
    config: {
        tags: ['api'],
        response: {
            schema: Joi.array().items(linkSchema)
        }
    }
}, {
    method: 'POST',
    path: '/links',
    handler: function (request, reply) {
        links.insert(request.payload);
        return reply();
    },
    config: {
        tags: ['api'],
        validate: {
            payload: linkSchema
        }
    }
}]);

server.register([
    Inert,
    Vision,
    {
        'register': HapiSwagger,
        'options': {
            info: {
                'title': Pack.name + ' API Documentation',
                'version': Pack.version,
            }
        }
    }], (err) => {
    // Start the server
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
});
