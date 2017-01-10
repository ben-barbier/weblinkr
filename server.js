'use strict';

const Hapi = require('hapi');
const Joi = require('joi');

const linkSchema = Joi.object({
    title: Joi.string().required(),
    url: Joi.string().uri().required(),
    description: Joi.string().allow(''),
    tags: Joi.array().required().items(Joi.string()).min(1).unique()
});

const links = [];

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 8000
});

// Add the route
server.route([{
    method: 'GET',
    path: '/links',
    handler: function (request, reply) {
        return reply(links);
    },
    config: {
        response: {
            schema: Joi.array().items(linkSchema)
        }
    }
}, {
    method: 'POST',
    path: '/links',
    handler: function (request, reply) {
        links.push(request.payload);
        return reply();
    },
    config: {
        validate: {
            payload: linkSchema
        }
    }
}]);

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
