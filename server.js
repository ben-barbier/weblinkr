'use strict';

const Hapi = require('hapi');

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
    }
}, {
    method: 'POST',
    path: '/links',
    handler: function (request, reply) {
        links.push(request.payload);
        return reply();
    }
}]);

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
