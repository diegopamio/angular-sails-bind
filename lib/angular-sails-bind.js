/*! angular-sails-bind - v1.0.5 - 2014-05-20
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

(function(){
    angular.module("ngSailsBind", []);

    angular.module("ngSailsBind").factory('$sailsBind', [
        '$q', "$rootScope", "$timeout", "$log",
        function ($q, $rootScope, $timeout, $log) {
            'use strict';

            function setObjectValue(obj, property, value){
                var parts = property.split(".");
                var cObj;
                var lastPart = parts.pop();
                while(parts.length){
                    cObj = obj[parts.shift()] || {};
                }
                cObj[lastPart] = value;
            }

            function getObjectValue(obj, property){
                var parts = property.split(".");
                var cObj;
                while(parts.length){
                    cObj = obj[parts.shift()] || {};
                }
                return (angular.isArray(cObj)?cObj:[]);
            }

            /**
             * This function basically does three things:
             *  1. Creates an array inside $scope and fills it with a socket get call to backend pointed by the
             *     resourceName endpoint.
             *  2. Setup the socket's incoming messages (created, updated and destroyed) to update the model.
             *  3. Setup watchers to the model to persist the changes via socket to the backend.
             * @param resourceName {string} is the name of the resource in the backend to bind, can have prefix route.
             * @param $scope {object} is the scope where to attach the bounded model.
             * @param subset {json} is the query parameters where you can filter and sort your initial model fill.
             *        check http://beta.sailsjs.org/#!documentation/reference/Blueprints/FindRecords.html to see
             *        what you can send.
             */
            var bind = function (resourceName, $scope, subset) {
                var scopeProperty = resourceName + "s";
                if(angular.isObject(resourceName)){
                    if(resourceName.hasOwnProperty("scopeProperty")){
                        scopeProperty = resourceName.scopeProperty;
                    }
                    if(resourceName.hasOwnProperty("scope")){
                        subset = $scope;
                        $scope = resourceName.scope;
                    }
                    if(resourceName.hasOwnProperty("query")){
                        subset = resourceName.query;
                    }
                    resourceName = resourceName.model;
                }


                var prefix = resourceName.split('/');
                if(prefix.length>1) {
                    resourceName = prefix.splice(prefix.length - 1, 1);
                    prefix = prefix.join('/') + '/';
                }else{
                    prefix = '';
                }

                var defer_bind = new $q.defer();
                //1. Get the initial data into the newly created model.
                var requestEnded = _get("/" + prefix + resourceName, subset);

                requestEnded.then(function (data) {
                    if ( ! angular.isArray(data) ) {
                        data=[data];
                    }

                    setObjectValue($scope, scopeProperty, data);
                    addCollectionWatchersToSubitemsOf(data, $scope, resourceName, prefix, scopeProperty);
                    init();
                    defer_bind.resolve();
                });

                //2. Hook the socket events to update the model.
                function onMessage(message) {
                    var elements = getObjectValue($scope, scopeProperty),
                        actions = {
                            created: function () {
                                getObjectValue($scope, scopeProperty).push(message.data);
                                return true;
                            },
                            updated: function () {
                                var updatedElement = find(
                                    elements,
                                    function (element) {
                                        return message.id == element.id;
                                    }
                                );
                                if (updatedElement) {
                                    angular.extend(updatedElement, message.data);
                                    return true;
                                }
                                return false;
                            },
                            destroyed: function () {
                                var deletedElement = find(
                                    elements,
                                    function (element) {
                                        return message.id == element.id;
                                    }
                                );
                                if (deletedElement) {
                                    elements.splice(elements.indexOf(deletedElement), 1);
                                    return true;
                                }
                                return false;
                            }
                        };
                    if (actions[message.verb]) {
                        if (actions[message.verb]())
                            $timeout(function(){ $scope.$apply(); });
                    } else {
                        $log.log("Unknown action »"+message.verb+"«");
                    }
                }
                io.socket.on(resourceName, onMessage);
                $scope.$on(resourceName, function (event, message) {
                    if ($scope.$id!=message.scope)
                        onMessage(message);
                });

                //3. Watch the model for changes and send them to the backend using socket.
                function init() {
                    $scope.$watchCollection(getObjectValue($scope, scopeProperty), function (newValues, oldValues) {
                        var addedElements, removedElements;
                        newValues = newValues || [];
                        oldValues = oldValues || [];
                        addedElements =  diff(newValues, oldValues);
                        removedElements = diff(oldValues, newValues);

                        removedElements.forEach(function (item) {
                            _get("/" + prefix + resourceName + "?id=" + item.id ).then(function (itemIsOnBackend) {
                                if (itemIsOnBackend && !itemIsOnBackend.error) {
                                    $rootScope.$broadcast(resourceName, { id: item.id, verb: 'destroyed', scope: $scope.$id });
                                    io.socket.delete("/" + prefix + resourceName + '/destroy/' + item.id);
                                }
                            });
                        });

                        addedElements.forEach(function (item) {
                            if (!item.id) { //if is a brand new item w/o id from the database
                                io.socket.put("/" + prefix + resourceName + '/create/', item, function (data) {
                                    _get("/" + prefix + resourceName + "/" + data.id ).then(function (newData) {
                                        angular.extend(item, newData);
                                        $rootScope.$broadcast(resourceName, { id: item.id, verb: 'created', scope: $scope.$id, data: angular.copy(item) });
                                    });
                                });
                            }

                        });

                        // Add Watchers to each added element
                        addCollectionWatchersToSubitemsOf(addedElements, $scope, resourceName, prefix, scopeProperty);
                    });
                };

                return defer_bind.promise;
            };

            /**
             * Adds watchers to each item in the model to perform the "post" when something there changes.
             * @param model is the model to watch
             * @param scope is the scope where the model belongs to
             * @param resourceName is the "singular" version of the model as used by sailsjs
             */
            var addCollectionWatchersToSubitemsOf = function (model, scope, resourceName, prefix, scopeProperty) {
                model.forEach(function (item) {
                    scope.$watchCollection(
                        getObjectValue(scope, scopeProperty).indexOf(item),
                        function (newValue, oldValue) {

                            if (oldValue && newValue) {
                                if (!angular.equals(oldValue, newValue) && // is in the database and is not new
                                    oldValue.id == newValue.id && //not a shift
                                    oldValue.updatedAt === newValue.updatedAt) { //is not an update FROM backend
                                    $rootScope.$broadcast(resourceName, { id: oldValue.id, verb: 'updated', scope: scope.$id, data: angular.extend(angular.copy(newValue),{ updatedAt: (new Date()).toISOString() }) });
                                    io.socket.post("/" + prefix  + resourceName + '/update/' + oldValue.id,
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

                io.socket.get(url, additional, function (res) {
                    $rootScope.$apply(defer.resolve(res));
                });
                return defer.promise;
            };

            return {
                bind: bind
            };
        }
    ]);

    function diff(arr1, arr2) {
        return arr1.filter(function (i) {
            return arr2.indexOf(i) < 0;
        });
    }

    function find(ary, predicate, thisArg){
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(ary);
        var length = list.length >>> 0;
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    }
})();

