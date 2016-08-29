'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: 8000 });

const plugins = [
    {
        register: require('./hapi-auth-dummy'),
        options: {}
    },
    {
        register: require('./hapi-auth-dummy-2'),
        options: {}
    },
    {
        register: require('./routes'),
        options: {}
    }

];

server.register(plugins, function (err){

    if (err){
        throw err;
    }

    server.start(function (err){

        if (err){
            throw err;
        }

        console.log('server is running at ' + server.info.uri);
    });
});

