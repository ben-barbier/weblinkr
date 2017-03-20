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
const ObjectId = require('mongodb').ObjectId;
const assert = require('assert');

let dbLinks;
mongodb.connect(process.env.MONGO_URI, function init(error, db) {
    assert.equal(null, error);
    console.log("Connected successfully to database");
    dbLinks = db.collection('links');
});

const linkSchema = Joi.object({
    _id: Joi.string(),
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
        return dbLinks.find({}).toArray().then((links) => {
            return reply(links.map((link) => {
                link._id = link._id.toString();
                return link;
            }));
        });
    },
    config: {
        tags: ['api'],
        response: {
            schema: Joi.array().items(linkSchema)
        }
    }
}, {
    method: 'GET',
    path: '/links/{linkId}',
    handler: function (request, reply) {
        if (!ObjectId.isValid(request.params.linkId)) {
            return reply('Link not found').code(404);
        }
        return dbLinks.findOne({_id: ObjectId(request.params.linkId)}).then((link) => {
            link._id = link._id.toString();
            return reply(link);
        }).catch(() => {
            return reply('Link not found').code(404);
        });
    },
    config: {
        tags: ['api'],
        response: {
            schema: linkSchema
        }
    }
}, {
    method: 'POST',
    path: '/links',
    handler: function (request, reply) {
        let newLink = request.payload;
        delete newLink._id;
        return dbLinks.insert(newLink).then(reply(newLink));
    },
    config: {
        tags: ['api'],
        validate: {
            payload: linkSchema
        }
    }
}, {
    method: 'PUT',
    path: '/links/{linkId}',
    handler: function (request, reply) {
        request.payload._id = ObjectId(request.params.linkId);
        return dbLinks.save(request.payload).then(reply());
    },
    config: {
        tags: ['api'],
        validate: {
            payload: linkSchema
        }
    }
}, {
    method: 'DELETE',
    path: '/links/{linkId}',
    handler: function (request, reply) {
        return dbLinks.remove({_id: ObjectId(request.params.linkId)}).then(reply());
    },
    config: {
        tags: ['api']
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
