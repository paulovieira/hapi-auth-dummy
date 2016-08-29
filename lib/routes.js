
'use strict';

const internals = {};

internals.allowedNames = ['john', 'anne', 'peter'];
internals.validateFunc = function (name, next2){

    debugger;
    let isValid = false;
    internals.allowedNames.forEach(function (allowedName){

        if (name === allowedName){
            isValid = true;
        }
    });

    return next2(null, isValid, { name: name });
};

exports.register = function (server, options, next){

    server.auth.strategy('test', 'dummy', false, {
        divisor: 5,
        validateFunc: internals.validateFunc
    });

    server.auth.strategy('test-2', 'dummy-2', false, {
        divisor: 6,
        validateFunc: internals.validateFunc
    });


    // route with no auth

    server.route({
        method: 'GET',
        path: '/no-auth',
        handler: function (request, reply){

            const message = 'this is the handler at no-auth\n';
            return reply(message);
        },
        config: {
            auth: false
        }
    });


    // routes with auth: single strategy

    server.route({
        method: 'GET',
        path: '/required-auth-single',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategy: 'test',
                mode: 'required'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/optional-auth-single',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategy: 'test',
                mode: 'optional'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/try-auth-single',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategy: 'test',
                mode: 'try'
            }
        }
    });


    // routes with auth: multiple strategies

    server.route({
        method: 'GET',
        path: '/required-auth-multiple',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategies: ['test', 'test-2'],
                mode: 'required'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/optional-auth-multiple',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategies: ['test', 'test-2'],
                mode: 'optional'
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/try-auth-multiple',
        handler: function (request, reply){

            const message = 'the handler has executed!\n\n' + JSON.stringify(request.auth);
            return reply(message);
        },
        config: {
            auth: {
                strategies: ['test', 'test-2'],
                mode: 'try'
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'routes'
};

