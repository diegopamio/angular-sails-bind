/*! angular-sails-bind - v0.2.0 - 2014-06-13
* https://github.com/diegopamio/angular-sails-bind
* Copyright (c) 2014 Diego Pamio; Licensed MIT */
/*! angular-sails-bind - v0.0.11 - 2014-05-27
 * https://github.com/diegopamio/angular-sails-bind
 * Copyright (c) 2014 Diego Pamio; Licensed MIT */
/*! angular-sails-bind - v0.0.7 - 2014-05-20
 * https://github.com/diegopamio/angular-sails-bind
 * Copyright (c) 2014 Diego Pamio; Licensed MIT */
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
    '$q',
    function ($socket, $q) {
        'use strict';
        /**
         * This function basically does three things:
         *  1. Creates an array inside $scope and fills it with a socket get call to backend pointed by the
         *     resourceName endpoint.
         *  2. Setup the socket's incoming messages (created, updated and destroyed) to update the model.
         *  3. Setup watchers to the model to persist the changes via socket to the backend.
         * @param resourceName {string} is the name of the resource in the backend to bind.
         * @param $scope {object} is the scope where to attach the bounded model.
         * @param subset {json} is the query parameters where you can filter and sort your initial model fill.
         *        check http://beta.sailsjs.org/#!documentation/reference/Blueprints/FindRecords.html to see
         *        what you can send.
         */
        var bind = function (resourceName, $scope, subset) {
            var defer_bind = new $q.defer();
            //1. Get the initial data into the newly created model.
            var requestEnded = $socket.get("/" + resourceName, subset);

            requestEnded.then(function (data) {
                $scope[resourceName + "s"] = data;
                defer_bind.resolve();
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
                                    return parseInt(message.id, 10) === parseInt(element.id, 10);
                                }
                            );
                            angular.extend(updatedElement, message.data);
                        },
                        destroyed: function () {
                            var deletedElement = $scope[resourceName + "s"].find(
                                function (element) {
                                    return parseInt(element.id, 10) === parseInt(message.id, 10);
                                }
                            );
                            if (deletedElement) {
                                elements.splice(elements.indexOf(deletedElement), 1);
                            }
                        }
                    };
                actions[message.verb]();
            });

            //3. Watch the model for changes and send them to the backend using socket.
            $scope.$watchCollection(resourceName + "s", function (newValues, oldValues) {
                function addCollectionWatchersToSubitemsOf(model) {
                    model.forEach(function (item) {
                        $scope.$watchCollection(
                                resourceName + 's' + '[' + $scope[resourceName + "s"].indexOf(item) + ']',
                            function (newValue, oldValue) {
                                if (oldValue && newValue) {
                                    if (!angular.equals(oldValue, newValue) && // is in the database and is not new
                                        parseInt(oldValue.id, 10) === parseInt(newValue.id, 10) && //not a shift
                                        oldValue.updatedAt === newValue.updatedAt) { //is not an update FROM backend
                                        $socket.post('/' + resourceName + '/update/' + oldValue.id,
                                            angular.copy(newValue));
                                    }
                                }
                            }
                        );
                    });
                }

                if (!oldValues && newValues) { //if is the first initial load
                    addCollectionWatchersToSubitemsOf(newValues);
                }
                var addedElements, removedElements;
                newValues = newValues || [];
                oldValues = oldValues || [];
                addedElements =  newValues.diff(oldValues);
                removedElements = oldValues.diff(newValues);

                removedElements.forEach(function (item) {
                    $socket.get("/" + resourceName + "?id=" + item.id ).then(function (itemIsOnBackend, error) {
                        if (itemIsOnBackend && !itemIsOnBackend.error) {
                            $socket.remove('/' + resourceName + '/destroy/' + item.id);
                        }
                    }, function(error) {
                        $socket.remove('/' + resourceName + '/destroy/' + item.id);

                    });
                });

                addedElements.forEach(function (item) {
                    if (!item.id) { //if is a brand new item w/o id from the database
                        $socket.put('/' + resourceName + '/create/', item, function (data) {
                            $socket.get("/" + resourceName + "/" + data.id ).then(function (newData) {
                                angular.extend(item, newData);
                            });
                        });
                    }

                    addCollectionWatchersToSubitemsOf(addedElements);
                });
            });
            return defer_bind.promise;
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
                    $rootScope.$apply(defer.resolve($cache[url]));
                } else {
                    delete additional.cache;

                    io.socket.request(url, additional, function (res) {
                        // Update cache
                        $cache[url] = res;
                        $rootScope.$apply(defer.resolve(res));
                        //defer.resolve(res)
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

if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return value;
                    }
                }
            }
            return undefined;
        }
    });
}

if (!Array.prototype.diff) {
    Array.prototype.diff = function (a) {
        return this.filter(function (i) {
            return a.indexOf(i) < 0;
        });
    };
}