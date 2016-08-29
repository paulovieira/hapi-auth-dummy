# hapi-auth-dummy

A dummy Hapi authentication plugin, just to understand how it works.

## Introduction

Hapi provides a sophisticated API to handle authentication. But understanding all the concepts and how they work together can be a bit overwhelming: 
 - [schemes](http://hapijs.com/api#serverauthschemename-scheme) and [strategies](http://hapijs.com/api#serverauthstrategyname-scheme-mode-options)
 - the semantics of the `reply` interface when used in the `authenticate` function of a scheme
 - how to use the user-defined `validateFunc` 
 - the [`auth`](http://hapijs.com/api#route-options) route configuration
 - and maybe some other obscure details...
 
This plugin implements a dummy authentication scheme where all this stuff is present and it's easy to see how it works.

## The 'dummy' scheme

The module in `lib/hapi-auth-dummy.js` is a hapi plugin that implement an authentication scheme named 'dummy'.

If a route is configured with an auth strategy that was created using this scheme, the client must send a query string in the format `token=n-name`, where `n` should be an integer and `name` can be anything (the name of the client, for instance). Example:
```
http://localhost:8000/required-auth-single?token=15-john
```

In the options for the strategy we should pass these options:
- `divisor`: a positive integer
- `validateFunc`: a function with signature `function(name, next)` where  `name` is the name given in the query string

The authentication process consists in the following: 

1) For every request sent to the protected route, the `authenticate` function is executed. 

First it verifies if `n` is a multiple of `divisor`. If not (or if there is no `n`), the authentication fails right there (the reply interface is called with a Boom error).

If we were using [cookies](https://github.com/hapijs/hapi-auth-cookie), this would be analogous of a request that sent an invalid/modified cookie (or that didn't send a cookie).

2) If `n` is a multiple, `validateFunc` is executed with the given name. It must be one of these: `['john', 'anne', 'peter']`. 

This array is defined by the user in the `lib/route.js` file. That's why the control is given to the user (via the `validateFunc` function).

If the name matches one of the valid names, the `next` callback should be called with `next(null, true, credentials)`. Otherwise it should be called with `next(null, false, credentials)`.

3) Back in the  `authenticate` function, the `isValid` argument is checked. 

If it is false, the reply interface is called as `reply(Boom.unauthorized(null, 'dummy'))`. Otherwise, we use `reply.continue({ credentials: credentials })`.

**IMPORTANT NOTE:** If the authentication fails (if `isValid` === false, for instance), the Boom error passed to `reply` SHOULD NOT have a message. This is necessary to make Hapi use other auth strategies (assuming the route has been configured with multiple strategies).

See the comments in `lib/hapi-auth-dummy.js` for more details.

## The 'dummy-2' scheme

This is a copy-paste of the 'dummy' scheme, but instead of sending the data in the query string, it should be sent in a custom header 'x-token'. Example:
```bash
curl http://localhost:8000/required-auth-multiple --header 'x-token: 20-peter'
```


## Single strategy routes

First we create the 'test' auth strategy, which uses the 'dummy' scheme. Then we define 3 routes configured with this strategy. They have the same configuration except for the auth mode:
- `/required-auth-single` - uses auth mode 'required'
- `/optional-auth-single` - uses auth mode 'optional'
- `/try-auth-single` - uses auth mode 'try'

## Multiple strategy routes

Then we create the 'test-2' auth strategy, which uses the 'dummy-2' scheme, and 3 other routes configured with both strategies (first the 'test' strategy is used; if authentication fails, the 'test-2' strategy is used):
- `/required-auth-multiple` - uses auth mode 'required'
- `/optional-auth-multiple` - uses auth mode 'optional'
- `/try-auth-multiple` - uses auth mode 'try'


## Examples

The examples below assume the `divisor` option is 5 for the strategy 'test' and 6 for 'test-2':

1) single strategy ('test')
```bash
curl http://localhost:8000/required-auth-single?token=19-peter
curl http://localhost:8000/required-auth-single?token=20-peter
```

The first request fails because `n` is invalid. 

The second succeeds. However is use `token=20-peterr` it will fail (this time because in `validateFunc` we call the `next` callback with false, but the end result is the same).

2) multiple strategies ('test' and 'test-2')
```bash
curl http://localhost:8000/required-auth-multiple?token=19-peter --header 'x-token: 23-peter'
curl http://localhost:8000/required-auth-multiple?token=19-peter --header 'x-token: 24-peter'
```
The first request fails because both strategies fails (19 is not a multiple of 5, 23 is not a multiple of 6)

The second succeeds: the first strategy fails ('test'), but the seconds one succeeds ('test-2').

Note that if the first strategy succeeds, the second stratgy is not used (that is, the `authenticate` function is not executed). Example:
```bash
curl http://localhost:8000/required-auth-multiple?token=20-peter --header 'x-token: 24-peter'
```
In the route handler we can use `request.auth.strategy` to check which strategy has been used to authenticate the request.

## 'required' mode vs 'try' mode 

With 'required' mode, we *only* reach the route handler if the request is authenticated (that is, if we call `reply.continue` in the `authenticate` function). 
This mode should be used for API endpoints with private data, for instance.

With 'try' mode we *always* reach the handler, even if the authentication failed. In the handler we can always verify if the request was authenticated using `request.auth.isAuthenticated` (we can always call `reply(boomErr)` from the handler, which would then be equivalent to using the 'required' mode).
This mode should be used for pages that have a private component, but that 
should also be publicly accessible. Example: a public web page with a 'hello john' message in the top-right corner.

