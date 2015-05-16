/*jshint expr: true*/
/*global describe, it, beforeEach, module, inject, expect */

var app, $sailsBindHelper;
describe('the angular sailsjs bind helper service', function(){
    'use strict';

    beforeEach(function () {
        //setup the driver angular app.
        app = angular.module("testApp", ['ngSailsBind']);
        module('testApp');

        inject(function (_$sailsBindHelper_) {
            $sailsBindHelper = _$sailsBindHelper_;
        });
    });

    it('should have defined set of exports', function () {
        expect(angular.isFunction($sailsBindHelper.setObjectProperty)).to.be.true;
        expect(angular.isFunction($sailsBindHelper.getObjectProperty)).to.be.true;
        expect(angular.isFunction($sailsBindHelper.diff)).to.be.true;
        expect(angular.isFunction($sailsBindHelper.find)).to.be.true;
        expect(angular.isFunction($sailsBindHelper.merge)).to.be.true;
    });

    describe('setObjectProperty', function(){
        it('setObjectProperty should set properties at any object level', function () {
            var obj = {};
            $sailsBindHelper.setObjectProperty(obj, "myTestProperty", 1);
            expect(obj.myTestProperty).to.equal(1);

            $sailsBindHelper.setObjectProperty(obj, "myTestProperty2.myTestSubProperty", 1);
            expect(obj.myTestProperty2).to.be.a("object");
            expect(obj.myTestProperty2.myTestSubProperty).to.equal(1);

            $sailsBindHelper.setObjectProperty(obj, "myTestProperty.myTestSubProperty", 1);
            expect(obj.myTestProperty2).to.be.a("object");
            expect(obj.myTestProperty2.myTestSubProperty).to.equal(1);
        });
    });

    describe('getObjectProperty', function(){
        it('getObjectProperty should get properties at any object level', function () {
            var obj = {
                "myTestProperty": 1,
                "myTestProperty2": {
                    "myTestSubProperty": 1
                }
            };

            expect($sailsBindHelper.getObjectProperty(obj, "myTestProperty")).to.equal(1);
            expect($sailsBindHelper.getObjectProperty(obj, "myTestProperty2.myTestSubProperty")).to.equal(1);
            expect($sailsBindHelper.getObjectProperty(obj, "myTestProperty2.myTestSubProperty2")).to.equal(undefined);
            expect($sailsBindHelper.getObjectProperty(obj, "myTestProperty2.myTestSubProperty2", 1)).to.equal(1);
        });
    });

    describe('diff', function(){

    });

    describe('merge', function(){

    });

    describe('find', function(){

    });
});