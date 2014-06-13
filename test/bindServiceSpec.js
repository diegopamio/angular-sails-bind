/**
 * Created by dpamio on 29/05/14.
 */
var app;
describe('the angular sailsjs bind service', function () {
    beforeEach(function () {
        //setup the driver angular app.
        app = angular.module("testApp", ['ngSailsBind']);
        module('testApp');
        inject(function (_$sailsBind_) {
            $sailsBind = _$sailsBind_;
        });
        inject(function (_$rootScope_) {
            $rootScope = _$rootScope_;
        });

        inject(function (_$q_) {
            $q = _$q_;
        });
    });

    it('should have a bind function', function () {
        expect(angular.isFunction($sailsBind.bind)).to.be.true;
    });
    describe('the bind function', function () {

        var modelName = "myModelItem",
            defaultData,
            newData = {
                'modelAttribute1': "new", 'modelAttribute2': 'data'
            };

        beforeEach(function (done) {
            defaultData = [
                {'id': '1', 'modelAttribute1': "string", 'modelAttribute2': 'another string'},
                {'id': '2', 'modelAtrribute1': "4", 'modelAttribute2': '10'}
            ];

//            io.socket.callbacks.length = 0;

            done();

        });

        it('should create a model named ' + modelName, function (done) {
            io.socket.when.get["/" + modelName] = {return: defaultData};
            $sailsBind.bind(modelName, $rootScope).then(function () {
                expect($rootScope[modelName + 's']).to.be.an("array");
                done();
            });
        });
        it('should load the model with the contents from the backend', function (done) {
            io.socket.when.get["/" + modelName] = {return: defaultData};
            $sailsBind.bind(modelName, $rootScope).then(function () {
                expect($rootScope[modelName + 's']).to.deep.equal(defaultData);
                done();
            });
        });

        it('should update the model when a new element is ADDED in the backend', function (done) {
            io.socket.when.get["/" + modelName] = {return: defaultData};
            $sailsBind.bind(modelName, $rootScope).then(function () {
                angular.extend(newData, {'id': '3'});
                io.socket.triggerOn(modelName, 'created', newData).then(function () {
                    expect($rootScope[modelName + 's']).to.have.length(3);
                    done();
                });
            });
        });
        it('should update the model when an  element is DELETED in the backend', function (done) {
            var removedData = {'id': 2};

            //Setup the data of the initial "get all"
            io.socket.when.get["/" + modelName] = {return: defaultData};

            //Do the binding
            $sailsBind.bind(modelName, $rootScope).then(function () {


                //Setup so that the item #2 is not returned in "get all" requests.
                io.socket.when.get["/" + modelName] =
                { return: {'id': '1', 'modelAttribute1': "string", 'modelAttribute2': 'another string'}
                };

                //Setup so that nothing is returned when specifically asking for item #2
                io.socket.when.get["/" + modelName + "?id=" + removedData.id ] = {return: {error: "id not found"}};

                //Simulate someone has deleted item 2 in the database.
                io.socket.triggerOn(modelName, 'destroyed', removedData, removedData.id).then(function () {
                    expect($rootScope[modelName + 's']).to.have.length(1);
                    done();
                });
            });
        });
        it('should update the model when an is MODIFIED in the backend', function (done) {
            var modifiedItem = {'id': '2', 'modelAtrribute1': "4", 'modelAttribute2': 'not10'};

            //Setup the data of the initial "get all"
            io.socket.when.get["/" + modelName] = {return: defaultData};

            //Do the binding
            $sailsBind.bind(modelName, $rootScope).then(function () {

                //Simulate someone has modified item 2 in the database.
                io.socket.triggerOn(modelName, 'updated', modifiedItem, modifiedItem.id).then(function () {
                    expect($rootScope[modelName + 's'][1]).to.deep.equal(modifiedItem);
                    done();
                });
            });
        });

//        it('should persist in the backend when a new element is ADDED in the client', function (done) {
//            $sailsBind.bind(modelName, $rootScope).then(function () {
//                $rootScope[modelName + 's'].push({name: "newElement"});
//
//                done();
//            })
//        });
//        it('should persist in the backend when a new element is REMOVED in the client', function (done) {
//            $sailsBind.bind(modelName, $rootScope).then(function () {
//                $rootScope[modelName + 's'].pop();
//                done();
//            })
//        });
//        it('should persist in the backend when a new element is MODIFIED in the client', function (done) {
//            $sailsBind.bind(modelName, $rootScope).then(function () {
//                $rootScope[modelName + 's'][0].modelAttribute1 = "another string";
//                done();
//            })
//        });
    });
});