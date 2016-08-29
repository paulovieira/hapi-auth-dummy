'use strict';

const Boom = require('boom');
const internals = {};

exports.register = function (server, pluginOptions, next){

    server.auth.scheme('dummy', internals.implementation);
    next();
};

exports.register.attributes = {
    name: 'hapi-auth-dummy'
};

internals.implementation = function (server, strategyOptions){

    // The scheme method must return an object with the following keys: 
    // - authenticate(request, reply) (required)
    // - payload(request, reply), 
    // - response(request, reply), 
    // - api
    // - options

    const scheme = {

        // called on each incoming request for routes that have been configured with 
        // a auth strategy that uses this scheme  
        authenticate: function (request, reply){

            debugger;
            const data = (request.query['token'] || '').split('-');
            if (data.length !== 2){
                return reply(Boom.unauthorized(null, 'dummy'));
            }

            const n = data[0];
            const name = data[1];
            const divisor = strategyOptions.divisor;

            if (n % divisor !== 0){
                return reply(Boom.unauthorized(null, 'dummy'));
            }

            strategyOptions.validateFunc(name, function (err, isValid, credentials) {

                // - if authentication succeeded, call reply.continue(result), where
                //   result = { credentials: ..., artifacts: ... }
                // - if authentication failed, call reply(err, null, result), where err 
                //   should be a Boom error

                // In the last case, the specifics of the error object affect whether additional
                // authentication strategies will be attempted (if configured for the route).

                // If the error passed to reply DOES INCLUDE a message: 
                //  - no additional strategies will be attempted
                //  - the route handler will be executed only if mode is 'try'
                //  - the result obj passed as the 3rd parameter (with credentials and artifacts) 
                //    will be available in the route (at request.auth)

                // If the error DOES NOT INCLUDE a message AND DOES INCLUDE the scheme name 
                // (e.g. Boom.unauthorized(null, 'Custom')), 
                //  - additional strategies will be attempted in order of preference.
                //  - the route handler will be executed only if mode is 'try' or 'optional'
                //  - the scheme name will be present in the WWW-Authenticate header
                //  - the result obj passed as the 3rd parameter will not be available 
                //    in the route

                // so the main ideas are: 

                // - if we include a message in the Boom error, it means we want to stop 
                // any other possibilities of authentication (assuming the route has
                //   multiple strategies)
                // - if we don't include the error message AND include the scheme name, we
                //   want to try the other strategies

                // - if we want the handler to always execute, use the mode 'try'
                // - if we want the handler to execute only if authentication succeeded,
                //   use mode 'required' (makes sense for API endpoints with private data)
                // - don't use mode 'optional' because its behaviour can be a bit confusing

                // in pratical terms, this is what happens in hapi-auth-cookie:
                // a) when there is no cookie (or cookie is invalid), the Boom error 
                //    given to reply DOES NOT HAVE a message
                // b) when the callback to validateFunc is called with an error or when
                //    isValid is false, the Boom error given to reply DOES HAVE a message

                // So if we use 'optional' mode, the handler would be executed in case a), but 
                // not in b) If we use 'try' mode, the handler would be executed in both cases

                credentials = credentials || null; 

                if (err) {
                    return reply(err, null, { credentials: credentials });
                }

                if (!isValid) {
                    // we are using a Boom error without message, so it useless
                    // to send the credentials in the 3rd param (will be discarded)                    
                    return reply(Boom.unauthorized(null, 'dummy'));
                }

                // authenticated
                return reply.continue({ credentials: credentials });
            });
        }
    };

    return scheme;
};
