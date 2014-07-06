/*! angular-sails-bind - v1.0.3 - 2014-07-11
* https://github.com/diegopamio/angular-sails-bind
* Copyright (c) 2014 Diego Pamio; Licensed MIT */
/*! angular-sails-bind - v1.0.3 - 2014-05-20
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
    '$q', "$rootScope",
    function ($q, $rootScope) {
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
            var requestEnded = _get("/" + resourceName, subset);

            requestEnded.then(function (data) {
		if ( ! Array.isArray(data) ) {
			data=[data];
		}
		$scope[resourceName + "s"] = data;
		addCollectionWatchersToSubitemsOf(data, $scope, resourceName);
		defer_bind.resolve();
            });

            //2. Hook the socket events to update the model.
            io.socket.on(resourceName, function (message) {
                var elements = $scope[resourceName + "s"],
                    actions = {
                        created: function () {
<<<<<<< HEAD
                            $scope.$apply(function() {
                                $scope[resourceName + "s"].push(message.data);
                            });
=======
                            elements.push(message.data);
>>>>>>> converted Array.prototype.diff to local function and cleaned up element refs
                        },
                        updated: function () {
                            var updatedElement = elements.find(
                                function (element) {
                                    return parseInt(message.id, 10) === parseInt(element.id, 10);
                                }
                            );
                            angular.extend(updatedElement, message.data);
                        },
                        destroyed: function () {
                            var deletedElement = elements.find(
                                function (element) {
                                    return parseInt(element.id, 10) === parseInt(message.id, 10);
                                }
                            );
                            if (deletedElement) {
                                $scope.$apply(function() {
                                    elements.splice(elements.indexOf(deletedElement), 1);
                                });
                            }
                        }
                    };
                actions[message.verb]();
                $scope.$apply();
            });

            //3. Watch the model for changes and send them to the backend using socket.
            $scope.$watchCollection(resourceName + "s", function (newValues, oldValues) {
                var addedElements, removedElements;
                newValues = newValues || [];
                oldValues = oldValues || [];
                addedElements =  diff(newValues, oldValues);
                removedElements = diff(oldValues, newValues);

                removedElements.forEach(function (item) {
                    _get("/" + resourceName + "?id=" + item.id ).then(function (itemIsOnBackend) {
                        if (itemIsOnBackend && !itemIsOnBackend.error) {
                            io.socket.delete('/' + resourceName + '/destroy/' + item.id);
                        }
                    });
                });

                addedElements.forEach(function (item) {
                    if (!item.id) { //if is a brand new item w/o id from the database
                        io.socket.put('/' + resourceName + '/create/', item, function (data) {
                            _get("/" + resourceName + "/" + data.id ).then(function (newData) {
                                angular.extend(item, newData);
                            });
                        });
                    }

                    addCollectionWatchersToSubitemsOf(addedElements, $scope, resourceName);
                });
            });
            return defer_bind.promise;
        };

        /**
         * Adds watchers to each item in the model to perform the "post" when something there changes.
         * @param model is the model to watch
         * @param scope is the scope where the model belongs to
         * @param resourceName is the "singular" version of the model as used by sailsjs
         */
        var addCollectionWatchersToSubitemsOf = function (model, scope, resourceName) {
            angular.forEach(model, function (item) {
                scope.$watchCollection(
                        resourceName + 's' + '[' + scope[resourceName + "s"].indexOf(item) + ']',
                    function (newValue, oldValue) {
                        if (oldValue && newValue) {
                            if (!angular.equals(oldValue, newValue) && // is in the database and is not new
                                parseInt(oldValue.id, 10) === parseInt(newValue.id, 10) && //not a shift
                                oldValue.updatedAt === newValue.updatedAt) { //is not an update FROM backend
                                io.socket.post('/' + resourceName + '/update/' + oldValue.id,
                                    angular.copy(newValue));
                            }
                        }
                    }
                );
            });
        };

        /**
         * Internal "get" function inherited. it does the standard request, but it also returns a promise instead
         * of calling the callback.
         *
         * @param url url of the request.
         * @param additional extra info (usually a query restriction)
         * @returns {Deferred.promise|*}
         * @private
         */
        var _get = function (url, additional) {
            var defer = new $q.defer();
            additional  = additional || {};

            io.socket.request(url, additional, function (res) {
        $rootScope.$evalAsync(function () {
          defer.resolve(res)
        });            });
            return defer.promise;
        };

        return {
            bind: bind
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

<<<<<<< HEAD
if (!Array.prototype.diff) {
    Array.prototype.diff = function (a) {
        return this.filter(function (i) {
            return a.indexOf(i) < 0;
        });
    };
}

if(!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

=======
function diff(arr1, arr2) {
    return arr1.filter(function (i) {
        return arr2.indexOf(i) < 0;
    });
}
>>>>>>> converted Array.prototype.diff to local function and cleaned up element refs
