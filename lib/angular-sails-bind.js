/*global angular:false */
/*global io:false */
/**
 * Angular service to handle SailsJs resources.
 *
 * @author Diego Pamio - Github: diegopamio

 * @return {object} Object of methods
 */

var app = angular.module("ngSailsBind", []);

app.factory('$sailsBind', [
    '$socket',
    function ($socket) {
        'use strict';
        /**
         * This function basically does three things:
         *  1. Creates an array inside $scope and fills it with a socket get call to backend pointed by the
         *     resourceName endpoint.
         *  2. Setup the socket's incoming messages (created, updated and destroyed) to update the model.
         *  3. Setup watchers to the model to persist the changes via socket to the backend.
         * @param resourceName {string} is the name of the resource in the backend to bind.
         * @param $scope is {object} the scope where to attach the bounded model.
         */
        var bind = function (resourceName, $scope) {
            (function () {
                //1. Get the initial data into the newly created model.
                $socket.get("/" + resourceName).then(function (data) {
                    $scope[resourceName + "s"] = data;
                });

                //2. Hook the socket events to update the model.
                $socket.on(resourceName, function (message) {
                    var elements = $scope[resourceName + "s"],
                        actions = {
                        created: function () {
                            $scope[resourceName + "s"].push(message.data);
                        },
                        updated: function () {
                            var updatedElement = $scope[resourceName + "s"].find(
                                    function (element) {
                                        return element.id === message.id;
                                    }
                                );
                            elements.splice(elements.indexOf(updatedElement), 1, message.data);
                        },
                        destroyed: function () {
                            var deletedElement = $scope[resourceName + "s"].find(
                                    function (element) {
                                        return element.id === message.id;
                                    }
                                );
                            elements.splice(elements.indexOf(deletedElement), 1);
                        }

                    };
                    actions[message.verb]();
                });

                //3. Watch the model for changes and send them to the backend using socket.
                $scope.$watchCollection(resourceName + "s", function (newValues, oldValues) {
                    if (!oldValues) {
                        return;
                    }
                    var addedElements, removedElements;
                    newValues = newValues || [];
                    oldValues = oldValues || [];
                    addedElements = newValues.diff(oldValues);
                    removedElements = oldValues.diff(newValues);

                    removedElements.forEach(function (item) {
                        $socket.remove('/' + resourceName + '/destroy/' + item.id);
                    });

                    addedElements.forEach(function (item) {
                        $socket.put('/' + resourceName + '/create/', item);
                    });
                });
            }());
        };
        return {
            bind: bind
        };
    }
]);

/**
 * Angular service to handle SailsJs sockets.
 *
 * @author David Tobin - Github: DavidTobin

 * @return {object} Object of methods
 */
app.factory('$socket', [
    '$q',
    '$rootScope',
    function ($q, $rootScope) {
        'use strict';
        var $cache      = {},

            /**
             * Sends get request
             *
             * Use cache=true on additional object to force use of caching
             *
             * @param url {string} Url of item to be read
             * @param additional {object} Object of additional data to be past with the request
             **/
            get = function (url, additional) {
                var defer = new $q.defer();
                additional  = additional || {};

                // Should we fallback to cache?
                additional.cache = additional.cache || false;

                if ($cache[url] && additional.cache) {
                    defer.resolve($cache[url]);
                } else {
                    delete additional.cache;

                    io.socket.request(url, additional, function (res) {
                        // Update cache
                        $cache[url] = res;

                        defer.resolve(res);
                    });
                }

                return defer.promise;
            },

            /**
             * Handles event listening for socket messages
             *
             * @param what {string} Event to listen for
             * @param callback {function} Callback for message
             **/
            on = function (what, callback) {
                io.socket.on(what, function () {
                    var args = arguments;

                    $rootScope.$apply(function () {
                        callback.apply(io.socket, args);
                    });
                });
            },

            /**
             * Sends post request
             *
             * @param url {string} Url of item to be created
             * @param data {object} Data to send with request
             * @param cb {function} Callback function to handle response
             **/
            post = function (url, data, cb) {
                io.socket.post(url, data, cb);
            },

            /**
             * Sends put request
             *
             * @param url {string} Url of item to be updated
             * @param data {object} Data to send with request
             * @param cb {function} Callback function to handle response
             **/
            put = function (url, data, cb) {
                io.socket.put(url, data, cb);
            },

            /**
             * Sends delete request
             *
             * @param url {string} Url of item to be deleted
             * @param cb {function} Callback function to handle response
             **/
            remove = function (url, cb) {
                io.socket.delete(url, cb);
            },

            /**
             * Handles socket message, allowing for live updating.
             *
             * @param model {string} Model to listen to
             * @param res {object} Response from $socket.on() callback
             * @param $scope {object} Scope to update data on
             **/
            handleMessage = function (model, res, $scope) {
                if (res.model === model) {
                    var i, j, keys;
                    if (res.verb === 'create') {
                        $scope.push(res.data);
                    }

                    if (res.verb === 'update') {
                        keys = Object.keys(res.data);
                        for (i = 0; i < $scope.length; i = i + 1) {
                            if ($scope[i].id === res.id) {
                                for (j = 0; j < keys.length; j = j + 1) {
                                    $scope[i][keys[j]] = res.data[keys[j]];
                                }
                            }
                        }
                    }

                    if (res.verb === 'destroy') {
                        for (i = 0; i < $scope.length; i = i + 1) {
                            if ($scope[i].id === res.id) {
                                $scope.splice(i, 1);
                            }
                        }
                    }
                }
            };

        return {
            get: get,
            on: on,
            post: post,
            put: put,
            remove: remove,
            handleMessage: handleMessage
        };
    }
]);
