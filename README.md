Angular Sails Bind
==================

An AngularJS service to bind Angular models with sailsjs backend models using socket.io.


Installation:

```shell
bower install angular-sails-bind
```

Usage
-----

A small example:

```javascript
var app = angular.module("MyApp", ['ngSailsBind']);
app.controller("ItemsCtrl", function ($scope, $sailsBind) {
  // To easily add new items to the collection.
  $scope.newItem = {};  
  /** This will:
  *     1. Add a "items" model to $scope. (pluralized)
  *     2. Get the data from your http://<examplesite.com>/item thru sailsjs socket get.
  *     3. Setup socket io so that, when something changes in the sailsjs backend, they will be reflected
  *        in the angular "items" model.
  *     4. Watch the "items" model for collection changes in angular (add and removal of items
  *        and send them to the backend using socket.
  **/
  $sailsBind("item", $scope);
```

```html
<div ng-controller="ItemsCtrl">
  <input ng-model="newItem.name"/><a href="" ng-click="items.push(newItem);newItem={}"></a>Add New
  <ul>
    <li ng-repeat="item in items">{{item.name}} <a href="" ng-click="items.splice(items.indexOf(item), 1)">remove</a></li>
  </ul>
</div>
```
