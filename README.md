Angular Sails Bind
==================
[![Code Climate Rating](https://codeclimate.com/github/diegopamio/angular-sails-bind.png)](https://codeclimate.com/github/diegopamio/angular-sails-bind)
[![Coverage Status](https://coveralls.io/repos/diegopamio/angular-sails-bind/badge.png?branch=master)](https://coveralls.io/r/diegopamio/angular-sails-bind?branch=master)
[![devDependency Status](https://david-dm.org/diegopamio/angular-sails-bind/dev-status.svg)](https://david-dm.org/diegopamio/angular-sails-bind#info=devDependencies)
[![Sauce Test Status](https://saucelabs.com/buildstatus/diegopamio?auth=81be93491f9e7bbfed6d61823bf9352c)](https://saucelabs.com/u/diegopamio)
[![Ohloh Info](https://www.ohloh.net/p/angular-sails-bind/widgets/project_thin_badge.gif)](https://www.ohloh.net/p/angular-sails-bind/)
[![Codeship Status for diegopamio/angular-sails-bind](https://www.codeship.io/projects/942c0fa0-d0ec-0131-db62-1211774025ad/status?branch=master)](https://www.codeship.io/projects/23182)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/diegopamio.svg?auth=81be93491f9e7bbfed6d61823bf9352c)](https://saucelabs.com/u/diegopamio)

An AngularJS service to bind [Angular](https://github.com/angular) models with [SailsJs](https://github.com/balderdashy/sails) backend models using [socket.io](https://github.com/Automattic/socket.io).

Add it as a dependency to your angular app, and then bind any model IN JUST ONE LINE!!!!!

```javascript
  $sailsBind.bind("<your model name here>", $scope);
```

how much it weights? It takes only 2073 bytes of pure javascript to add this magic to your angularjs project.

What it does:

* Creates the model inside the $scope for you.
* Retrieves the model data from the backend using socket.
* Watches for changes made by the user in the UI and updates the backend immediately.
* Watches for changes made in the backend and updates the UI immediately.

Installation
-----

Install via bower:

```shell
bower install angular-sails-bind
```

or NPM:

```shell
npm install angular-sails-bind
```

Usage
-----

A small example:

```javascript
angular.module("MyApp", ['ngSailsBind']);
angular.module("MyApp").controller("ItemsCtrl", function ($scope, $sailsBind) {
  $scope.newItem = {}; // To easily add new items to the collection. 
  
  /** This will:
  *     1. Add a "items" model to $scope. (pluralized)
  *     2. Get the data from your http://<examplesite.com>/item through sailsjs
  *     socket get.
  *     3. Setup socket io so that, when something changes in the sailsjs
  *     backend, they will be reflected in the angular "items" model.
  *     4. Watch the "items" model for collection changes in angular (add
  *     and removal of items and send them to the backend using socket.
  **/
  
  $sailsBind.bind("item", $scope);
});
```

```html
<div ng-controller="ItemsCtrl">
  <input ng-model="newItem.name"/>
  <a href="" ng-click="items.push(newItem);newItem={}">Add New</a>
  <ul>
    <li ng-repeat="item in items">{{item.name}}
      <a href="" ng-click="items.splice(items.indexOf(item), 1)">remove</a>
    </li>
  </ul>
</div>
```

Getting a subset of the model:

You can filter the initial model content by adding a third parameter to the $sailsBind function (thanks @Shalotelli for the request). 

```javascript
   $sailsBind.bind("item", $scope, {"name": {"contains": "Foo"}};
```

This third parameter is json following the "where" clause syntax, as documented in sails' find call: 
[http://beta.sailsjs.org/#!documentation/reference/Blueprints/FindRecords.html]()

Advanced
-----

You can supply an object as the first parameter of the bind method.  

```javascript
   $sailsBind.bind({
     model: "item",
     scopeProperty: "users"
   }, $scope, {"name": {"contains": "Foo"}};
```

This will bind the Sails `item` model to the angular scope property `users` with the given search query. The default option is for the model item to bind to $scope.items (and user to $scope.users ...etc).  Using the above format, the exact scope parameter can be specified.

You can also, use the following compact format:

```javascript
   $sailsBind.bind({
     model: "item",
     scopeProperty: "users",
     scope: $scope
   }, {"name": {"contains": "Foo"}};
```

**Note:** If you are supplying and object to the bind method (instead of the method name) you must present the Sails model you are binding to via the model parameter.

You can also bind to a sub parametre of the scope; which is useful if you are using **ControllerAs**.

```javascript
   $sailsBind.bind({
     model: "item",
     scopeProperty: "data.users",
     scope: $scope
   }, {"name": {"contains": "Foo"}};
```
