angular.module('ngSailsBind').factory('$sailsBindHelper', function(){
    'use strict';

    /**
     * @description
     * Set a property within an object. Can set properties deep within objects using dot-notation.
     *
     * @todo    Unit Tests need to be more robust as this was passing but failing in real world use.  See
     *          git:f3a56211273315ea73c267dc5c841b2293e1e446 for code, which should fail due to code error.
     *
     * @public
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
     * @public
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
     * @public
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
     * @public
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
     * @pulic
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

    var angularSailsBindHelper = {
        'setObjectProperty': setObjectProperty,
        'getObjectProperty': getObjectProperty,
        'find': find,
        'diff': diff,
        'merge': merge
    };

    if(isUnitTest()){
        //
    }

    return angularSailsBindHelper;
});