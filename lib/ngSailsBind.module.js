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