/*! angular-sails-bind - v1.0.5 - 2015-05-05
* https://github.com/diegopamio/angular-sails-bind
* Copyright (c) 2015 Diego Pamio; Licensed MIT */
/*! angular-sails-bind - v1.0.5 - 2014-05-20
 * https://github.com/diegopamio/angular-sails-bind
 * Copyright (c) 2014 Diego Pamio; Licensed MIT */
/*global angular:false */
/*global io:false */

/**
 * @author Diego Pamio - Github: diegopamio
 * @license MIT
 *
 * @ngdoc module
 * @module ngSailsBind
 *
 * @description
 * Angular module to handle binding between SailsJs sever models and AnguarJs models in browsers 
 *
 * @return {object} Object of methods
 */
try{ // This is so that angular-sails-bind works well with the module angular-sails.
    angular.module('ngSails');
    angular.module('ngSailsBind', ['ngSails']);
}catch(e){
    angular.module('ngSailsBind', []).factory('$sails', function(){
        return io.socket;
    });
}

/*
 * @ngdoc service
 * @kind object
 * @name $sailsBind
 */
angular.module('ngSailsBind').factory('$sailsBind', [
    '$q', '$rootScope', '$timeout', '$log', '$sails',
    function ($q, $rootScope, $timeout, $log, $sails) {
        'use strict';

        var configuration = {
            autoSave: true,
            autoUpdate: true,
            broadcast: {
                error: false,
                change: false,
                models: {}
            },
            broadcastType: "model" // Can choose: model|simple|both - model is the backwards compatible version.
        };

        var defaultConfiguration = angular.copy(configuration);

        var eventRegister = {
            error: [],
            change: []
        };

        var httpErrorLookup = {
            400: "Malformed resource request.",
            401: "Not authorized to access this resource.",
            402: "Payment required to access this resource.",
            403: "Access to this resource is forbidden.",
            404: "Resource not found.",
            405: "Requests to resource using this method is not allowed.",
            406: "Cannot send resource in acceptable format.",
            407: "Proxy authentication required to access this resource.",
            408: "Request timeout.",
            409: "There is a conflict in your request, which cannot be resolved by the server.",
            410: "This resource is no-longer available, please update your client.",
            500: "Server error",
            501: "Requested service or feature is not implimented",
            502: "Could not forward the response through proxy.",
            503: "Server not available.",
            504: "Proxy timeout."
        };

        /**
         * @ngdoc function
         * @name $sailsBind.bind
         * @module ngSailsBind
         * @kind function
         * @public
         *
         * @description
         * This function basically does three things:<ol>
         * <li>Creates an array inside $scope and fills it with a socket get call to backend pointed by the
         *     resourceName endpoint.</li>
         * <li>Setup the socket's incoming messages (created, updated and destroyed) to update the model.</li>
         * <li>Setup watchers to the model to persist the changes via socket to the backend.</li>
         * </ol>
         *
         * @param {string|object} resourceName          Either an object defining the bind requirements or the name of 
         *                                              the resource in the backend to bind, can have prefix route.
         * @param {string} resourceName.module          The sails model to bind to.
         * @param {Object} [resourceName.scopeProperty] The property within scope to use (can be sub-property - use 
         *                                              dots to declare specific sub-property).
         * @param {Object} [resourceName.query]         The database query to use (will override the subset parameter).
         * @param {Object} [resourceName.scope]         The scope object to use (will override the $scope parameter).
         * @param {Object} [$scope]                     The scope where to attach the bounded model.
         * @param {Object} [subset]                     The query parameters where you can filter and sort your 
         *                                              initial model fill. check {@link http://beta.sailsjs.org
         *                                              /#!documentation/reference/Blueprints/FindRecords.html|Blueprint
         *                                              Queries} to see what you can send.
         */
        function bind(resourceName, $scope, subset) {
            var options = getOptions(resourceName, $scope, subset);
            var defer = new $q.defer();
            var url = getSailsApiRoute(options, null);

            //1. Get the initial data into the newly created model.
            _get(options, url, subset).then(function(data){
                if (!angular.isArray(data)){
                    data=[data];
                }
                setObjectProperty(options.scope, options.scopeProperty, data);
                addCollectionWatchersToSubitemsOf(data, options);
                initModel(options);  //3. Watch the model for changes and send them to the backend using socket.
                defer.resolve();
            });

            //2. Hook the socket events to update the model.
            $sails.on(options.model, onMessage.bind(this, options));
            options.scope.$on(options.model, function (event, message){
                if(options.scope.$id !== message.scope){
                    onMessage(options, message);
                }
            });

            return defer.promise;
        }

        /*
         * @description
         * Convert the given parameters into an options object, which defines the user chosen options for the 
         * current model binding.  Some properties of the object are calculated from those supplied and
         * some generated.
         *
         * @private
         * @param {string|object} resourceName          Either an object defining the bind requirements or the name of 
         *                                              the resource in the backend to bind, can have prefix route.
         * @param {string} resourceName.module          The sails model to bind to.
         * @param {Object} [resourceName.scopeProperty] The property within scope to use (can be sub-property - use 
         *                                              dots to declare specific sub-property).
         * @param {Object} [resourceName.query]         The database query to use (will override the subset parameter).
         * @param {Object} [resourceName.scope]         The scope object to use (will override the $scope parameter).
         * @param {Object} [$scope]                     The scope where to attach the bounded model.
         * @param {Object} [subset]                     The query parameters where you can filter and sort your 
         *                                              initial model fill. check {@link http://beta.sailsjs.org
         *                                              /#!documentation/reference/Blueprints/FindRecords.html|Blueprint
         *                                              Queries} to see what you can send.
         * @returns {Object}                            The options object.
         */
        function getOptions(options, $scope, subset){
            if(angular.isObject(options)){
                if(!options.hasOwnProperty('scopeProperty')){
                    options.scopeProperty = options.model.split('/').pop() + 's';
                }
                if((!options.hasOwnProperty('scope'))  && ($scope !== undefined)){
                    options.scope = $scope;
                }
                if((!options.hasOwnProperty('query'))  && (subset !== undefined)){
                    subset = options.query;
                }
            }else{
                options = {
                    model: options,
                    scopeProperty: options.split('/').pop() + 's',
                    scope: $scope
                };
                if(subset !== undefined){
                    options.query = subset;
                }
            }

            options.prefix = options.model.split('/');
            if(options.length>1) {
                options.model = options.prefix.splice(options.prefix.length - 1, 1);
                options.prefix = options.prefix.join('/') + '/';
            }else{
                options.prefix = '';
            }

            return options;
        }

        function onMessage(options, message) {
            var elements = getObjectProperty(options.scope, options.scopeProperty, []);
            var actions = {created: onCreated, updated: onUpdated, destroyed: onDestroyed};

            if (actions[message.verb]) {
                if (actions[message.verb](options, message, elements)){
                    $timeout(function(){
                        options.scope.$apply();
                    });
                }
            } else {
                $log.log('Unknown action »'+message.verb+'«');
            }
        }

        function onCreated(options, message, elements){
            getObjectProperty(options.scope, options.scopeProperty, []).push(message.data);
            return true;
        }

        function onUpdated(options, message, elements){
            var updatedElement = find(elements, function (element){
                return message.id.toString() === element.id.toString();
            });
            if(updatedElement){
                angular.extend(updatedElement, message.data);
                return true;
            }
            return false;
        }

        function onDestroyed(options, message, elements){
            var deletedElement = find(elements, function (element){
                return message.id.toString() === element.id.toString();
            });
            if(deletedElement){
                elements.splice(elements.indexOf(deletedElement), 1);
                return true;
            }
            return false;
        }

        function initModel(options) {
            options.scope.$watchCollection(options.scopeProperty, function(newValues, oldValues){
                watcher(options, newValues, oldValues);
            });
        };

        function watcher(options, newValues, oldValues){
            newValues = newValues || [];
            oldValues = oldValues || [];

            var addedElements =  diff(newValues, oldValues);
            var removedElements = diff(oldValues, newValues);

            angular.forEach(removedElements, removeElementFromModel.bind(this, options));
            angular.forEach(addedElements, addElementToModel.bind(this, options));

            // Add Watchers to each added element
            addCollectionWatchersToSubitemsOf(addedElements, options);
        }

        function removeElementFromModel(options, item){
            var url = getSailsApiRoute(options, null, item.id);
            _get(options, url).then(function (itemIsOnBackend) {
                if(itemIsOnBackend && !itemIsOnBackend.error){
                    fireEvent(options, createEventObject(options, item, 'destroyed'));
                    fireEvent('change', createChangeObject('destroyed', options, item));
                                
                    url = getSailsApiRoute(options, 'destroy', item.id);
                    $sails.delete(url, function(res, jwres){
                        if(jwres.error){
                            fireEvent('error', options, createErrorObject(jwres, 'delete', url, {}));
                            fireEvent(options, createEventObject(options, item, 'error'));
                        }
                    });
                }
            });
        }

        function addElementToModel(options, item){
            if (!item.id) { //if is a brand new item w/o id from the database
                var url = getSailsApiRoute(options, 'create');
                $sails.put(url, item, function (data, jwres) {
                    if(jwres.error){
                        fireEvent('error', options, createErrorObject(jwres, 'put', url, item));
                        fireEvent(options, createEventObject(options, item, 'error'));
                    }else{
                        url = getSailsApiRoute(options, null, data.id);
                        _get(options, url).then(function (newData) {
                            angular.extend(item, newData);
                            fireEvent('change', createChangeObject('created', options, item));
                            fireEvent(options, createEventObject(options, item, 'created', angular.copy(item)));
                        });
                    }
                });
            }
        }

        function getSailsApiRoute(options, verb, id){
            var url = '/' + options.prefix + options.model;
            url += ((verb)?'/'+verb+'/':'/');
            url += ((id)?'?id='+id:'');
            
            return url;
        }

        /**
         * @ngdoc function
         * @name $sailsBind.default
         * @module ngSailsBind
         * @kind function
         * @public
         *
         * @description
         * Reset the global configuration for this module to default.  Will affect all instances.
         */
        function resetConfig(){
            configuration = angular.copy(defaultConfiguration);
        }

        /**
         * @ngdoc function
         * @name $sailsBind.config
         * @module ngSailsBind
         * @kind function
         * @public
         *
         * @description
         * Set the global configuration for this module.  Will affect all instances (only overwrites
         * supllied properties).
         *
         * @param {object} userConfig       The config object to use (only overwrites supllied properties).
         */
        function config(userConfig){
            merge(configuration, userConfig);
        }

        /*
         * @ngdoc function
         * @name $sailsBind.save
         * @module ngSailsBind
         * @kind function
         * @public
         *
         * @todo    Perform a manual save.  Override needs adding so that changes to models in Angular not always 
         *          propegated to Sails.  Sometimes you want to complete an entire form first or validate.  Save
         *          will be used in these circumstance to save the data to Sails model.
         *
         * @public
         * @param {string} scopeProperty    The scope variable, which is changed and needs saving to sails (must be
         *                                  property, which already bound to Sails model).
         */
        function save(scopeProperty){
            var binding = getBinding(scope, scopeProperty);
            if(binding){
                watcher(
                    binding.options,
                    binding.data,
                    getObjectProperty(binding.options.scope, binding.scopeProperty)
                )
            }
        }

        /**
         * @ngdoc function
         * @name $sailsBind.on
         * @module ngSailsBind
         * @kind function
         * @public
         * 
         * @description
         * Capture a given module event.  If $sailsBind.config({broadcastType: "simple"}) is set then this
         * is the only way to capture module events (including errors).  If a broadcastType of 'model' or both
         * is set then events are broadcast on the $rootScope.  Turning rootScope broadcast off isgood practice
         * as dependancies are obvious and events are only dispached to listener, which need to hear.
         *
         * @public
         * @param {string} eventName        The name of the event to capture.
         * @param {function} callback       The callback for the event.
         * @param {object} context          The 'this' context to use.
         */
        function on(eventName, callback, context){
            if(eventRegister.hasOwnProperty(eventName)){
                eventRegister[eventName].push({
                    callback: callback,
                    context: context
                });
            }else{
                throw new Error('Cannot register for event: ' + eventName);
            }
        }

        /**
         * @description
         * Fire an event, providing an supplied paramaters to the registered handlers.
         * 
         * @private
         * @param {string} eventName    The event to fire.
         */
        function fireEvent(eventName, options){
            var broadcastType;

            if(angular.isString(eventName)){
                var args = [];

                for(var i=1; i<arguments.length; i++){
                    args.push(arguments[i]);
                }

                broadcastType = getConfigurationOption('broadcastType', options).toLowerCase();
                if(eventRegister.hasOwnProperty(eventName)){
                    angular.forEach(eventRegister[eventName], function(regstration){
                        regstration.callback.apply(regstration.context, args);
 
                        var canBroadcast = getConfigurationOption('broadcast.'+eventName, options);
                        if((canBroadcast === true) && ((broadcastType === 'simple') || (broadcastType === 'both'))){
                            $rootScope.$broadcast.apply(
                                $rootScope, 
                                ['angularSailsBind.' + eventName].concat(args)
                            );
                        }
                    });
                }
            }else if(angular.isObject(eventName)){
                var eventObject = options;
                options = eventName;
                eventName = options.model;

                broadcastType = getConfigurationOption('broadcastType', options).toLowerCase();
                var canBroadcast = getConfigurationOption('broadcast.models.'+eventName, options);
                if((broadcastType === 'model') || (broadcastType === 'both')){
                    if((canBroadcast === true) || (canBroadcast === undefined)){
                        $rootScope.$broadcast(eventName, eventObject);
                    }
                }
            }
        }

        /**
         * @description
         * Adds watchers to each item in the model to perform the "post" when something there changes.
         *
         * @private
         * @param {Array} addedElements             The new elements.
         * @param {Object} options                  An options object (as returned by getOptions().
         * @param {string} options.model            The "singular" version of the model as used by sailsjs.
         * @param {string} options.prefix           The api prefix to use.
         * @param {string} options.scopeProperty    The scope property to bind to
         */
        function addCollectionWatchersToSubitemsOf(addedElements, options) {
            addedElements.forEach(addedElement);

            function addedElement(item){
                var itemIndex = getObjectProperty(options.scope, options.scopeProperty, []).indexOf(item);
                var propertyName = options.scopeProperty+'['+itemIndex + ']';
                options.scope.$watchCollection(propertyName,watcher);
            }

            function watcher(newValue, oldValue){
                if(oldValue && newValue){
                    if(
                        !angular.equals(oldValue, newValue) && // is in the database and is not new
                        oldValue.id === newValue.id && //not a shift
                        oldValue.updatedAt === newValue.updatedAt
                    ){ //is not an update FROM backend
                        var eventData = angular.extend(
                            angular.copy(newValue), {
                                updatedAt: (new Date()).toISOString()
                            }
                        );
                        fireEvent(options, createEventObject(options, oldValue, 'updated', eventData));
                        fireEvent('updated', createChangeObject('updated', options, eventData));
                        var url = getSailsApiRoute(options, 'update', oldValue.id);
                        var additional = angular.copy(newValue);
                        $sails.post(url, additional, function(res, jwres){
                            if(jwres.error){
                                fireEvent('error', options, createErrorObject(jwres, 'post', url, additional));
                                fireEvent(options, createEventObject(options, oldValue, 'error'));
                            }
                        });
                    }
                }
            }
        }

        /**
         * @description
         * Get a config option within the current binding.  Looks first to the current options and if not
         * found, get from the global configuration object.
         *
         * @private
         * @param {string} propertyName     The property to get (use dots to indicate sub-properties).
         * @param {Object} options          Options for current binding.
         * @returns {mixed}                 The actual config option value.
         */
        function getConfigurationOption(propertyName, options){
            return getObjectProperty(
                options,
                propertyName,
                getObjectProperty(configuration, propertyName)
            );
        }

        /**
         * @description
         * Internal "get" function inherited. it does the standard request, but it also returns a promise instead
         * of calling the callback.
         *
         * @todo    This passes unit testing but fails in real world use when using angular-sails.  This needs some
         *          sort of unit test as is supposed to work. Obviously, function is never reached as then is needed.
         *          This will require the Unit Testing being rewritten or some detection of then() to use when available.
         *
         * @private
         * @param {Object} option           The current model binding options object.
         * @param {string} url              Url of the request.
         * @param {object} [additional]       Extra info (usually a query restriction)
         * @returns {Deferred.promise|*}
         */
        function _get(options, url, additional) {
            var defer = new $q.defer();
            additional  = additional || {};

            $sails.get(url, additional, function (res, jwres) {
                if(jwres.error){
                    fireEvent('error', options, createErrorObject(jwres, 'get', url, additional));
                    fireEvent(options, createEventObject(options, 'error'));
                }else{
                    $rootScope.$apply(defer.resolve(res));
                }
            });
            
            return defer.promise;
        }

        /**
         * @description
         * Get an error object to issue. This is boradcastType = 'simple', in the global configuration.
         *
         * @private
         * @param {Object} jwres        The jwres object returned by Sails Socket.io
         * @param {string} method       The http method used (usually one of: get|post|put|delete).
         * @param {string} url          The url requested.
         * @param {Object} additional   Any query used in the API call.
         */
        function createErrorObject(jwres, method, url, additional){
            return {
                target: {
                    src: url,
                    method: method,
                    content: additional || {}
                },
                type: jwres.statusCode,
                message: getErrorMessage(jwres.statusCode, jwres.body)
            };
        }

        /**
         * @description
         * Create a change event object. This is boradcastType = 'simple', in the global configuration.
         *
         * @private
         * @param {string} type         The change type.
         * @param {Object} options      The current bindings options object.
         * @param {Object} item         The item which is the cause of the event.
         * @returns {Object}
         */
        function createChangeObject(type, options, item){
            return {
                target: {
                    scopeProperty: options.scopeProperty,
                    id: item.id
                },
                type: type
            };
        }

        /**
         * @description
         * Create an event object to be issued via $rootScope.$broadcast.  This is boradcastType = 'model', in
         * the global configuration.
         *
         * @private
         * @param {Object} options      The current bindings options object.
         * @param {Object} item         The item which is the cause of the event.
         * @param {string} verb         Word describing the event (ie. event type).
         * @param {Array} [data]        Any data relating to the event
         * @returnd {Object}
         */
        function createEventObject(options, item, verb, data){
            var eventObj;

            if(angular.isString(item)){
                eventObj = {verb: item, scope: options.scope.$id};
                data = verb;
            }else{
                eventObj = {id: item.id, verb: verb, scope: options.scope.$id};
            }
            
            if(data !== undefined){
                eventObj.data = data;
            }

            return eventObj;
        }


        /**
         * @description
         * Get an error message for a given status code.  Will return the error message from the server, stored
         * in body parameter.  If body is empty then look-up status code and return a suitable message.  If code
         * cannot be found return undefined
         *
         * @private
         * @param {number} statusCode       The http status code.
         * @param {string} body             The error message string, issued by the server.
         * @returns {string|undefined}      The error message string.
         */
        function getErrorMessage(statusCode, body){
            if(angular.isString(body)){
                return body;
            }else{
                if(httpErrorLookup.hasOwnProperty(statusCode)){
                    return httpErrorLookup[statusCode];
                }
            }

            return undefined;
        }

        /**
         * @description
         * Is the factory being executed with a Unit Test?  Useful for exporting private methods for testing.
         *
         * @private
         * @return {boolean}
         */
        function isUnitTest(){
            var global;

            /* jshint ignore:start */
            try {
                global = Function('return this')() || (42, eval)('this');
            }catch(e){
                global = window;
            }
            /* jshint ignore:end */

            return ((global.hasOwnProperty('describe')) && (global.hasOwnProperty('it')));
        }

        /**
         * @description
         * Set a property within an object. Can set properties deep within objects using dot-notation.
         *
         * @todo    Unit Tests need to be more robust as this was passing but failing in real world use.  See
         *          git:f3a56211273315ea73c267dc5c841b2293e1e446 for code, which should fail due to code error.
         *
         * @private
         * @param {object} obj          Object to set property on.
         * @param {string} property     The property to set use dot-notation to specify sub-properties.
         * @param {mixed} value         The value to set property to.
         */
        function setObjectProperty(obj, property, value){
            var parts = property.split('.');
            var cObj = obj;
            var lastPart = parts.pop();
            while(parts.length){
                cObj[parts[0]] = obj[parts[0]] || {};
                cObj = obj[parts.shift()];
            }
            cObj[lastPart] = value;
        }

        /**
         * @description
         * Get a property value within an object.  Can retrieve from deeply within the object
         * using dot-notation.
         * 
         * @private
         * @param {object} obj              The object to a property value of.
         * @param {string} property         The property to retrieve (use dot-notation to get from deep within object).
         * @param {mixed} [defaultValue]    The default value to return if property not found or undefined.
         * @return {mixed}
         */
        function getObjectProperty(obj, property, defaultValue){
            property = ((angular.isArray(property))?property:property.split('.'));
            while(property.length && (obj = obj[property.shift()])){}
            return ((obj === undefined)?defaultValue:obj);
        }

        /**
         * @description
         * Array differencing function.
         *
         * @private
         * @param {Array} ary1  The array to compare against.
         * @param {Array} ary2  The array to compare with.
         * @return {Array}
         */
        function diff(ary1, ary2) {
            return ary1.filter(function (i) {
                return ary2.indexOf(i) < 0;
            });
        }

        /**
         * @description
         * ES6 Array method (Array.prototype.find()).  Returns a value in the array, if an element in the
         * array satisfies the provided testing function. Otherwise undefined is returned.
         * 
         * @private
         * @param {Array} ary           The array to use.
         * @param {function} predicate  The testing function.
         * @param {Object} [thisArg]    The context to use.
         * @returns {mixed|undefined}
         */
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

        /*
         * @description
         * Perform a deep extend on the supplied objects.  Similar to angular.merge() in v1.4+ of angular.
         * However, this does not merge fromthe prototype.
         *
         * @private
         * @param {Object} dest     Object to merge into.
         * @param {...Object}       Objects to merge into dest.
         * @returns {Object}        Reference to dest object.
         */
        function merge(dest){
            for(var n=1; n<arguments.length; n++){
                for(var property in arguments[n]){
                    if(arguments[n].hasOwnProperty(property)){
                        if(angular.isObject(arguments[n][property])){
                            if(angular.isObject(dest[property])){
                                merge(dest[property], arguments[n][property]);
                                continue;
                            }
                        }
                        dest[property] = arguments[n][property];
                    }
                }
            }

            return dest;
        }

        var angularSailsBind = {
            'bind': bind,
            'on': on,
            'save': save,
            'config': config,
            'default': resetConfig
        };

        if(isUnitTest()){
            angularSailsBind['setObjectProperty'] = setObjectProperty;
            angularSailsBind['getObjectProperty'] = getObjectProperty;
        }

        return angularSailsBind;
    }
]);