// copy-paste of the 'dummy' scheme

'use strict';

const Boom = require('boom');
const internals = {};

exports.register = function (server, pluginOptions, next){

    server.auth.scheme('dummy-2', internals.implementation);
    next();
};

exports.register.attributes = {
    name: 'hapi-auth-dummy-2'
};

internals.implementation = function (server, strategyOptions){

    const scheme = {

        authenticate: function (request, reply){

            debugger;
            const data = (request.headers['x-token'] || '').split('-');
            if (data.length !== 2){
                return reply(Boom.unauthorized(null, 'dummy-2'));
            }

            const n = data[0];
            const name = data[1];
            const divisor = strategyOptions.divisor;

            if (n % divisor !== 0){
                return reply(Boom.unauthorized(null, 'dummy-2'));
            }

            strategyOptions.validateFunc(name, function (err, isValid, credentials) {

                credentials = credentials || null; 

                if (err) {
                    return reply(err, null, { credentials: credentials });
                }

                if (!isValid) {
                    return reply(Boom.unauthorized(null, 'dummy-2'));
                }

                // authenticated
                return reply.continue({ credentials: credentials });
            });
        }
    };

    return scheme;
};
