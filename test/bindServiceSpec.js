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

        inject(function($injector) {
            $timeout = $injector.get('$timeout');
            //$timeout.flush();
        })
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

        beforeEach(function () {
            defaultData = [
                {'id': '1', 'modelAttribute1': "string", 'modelAttribute2': 'another string'},
                {'id': '2', 'modelAtrribute1': "4", 'modelAttribute2': '10'}
            ];
            //Setup the data of the initial "get all"
            io.socket.when.get["/" + modelName] = {return: defaultData};

        });

        afterEach(function() {
           io.socket.when = {
                put: {},
                get: {},
                delete: {}
            };
        });

        it('should create a model named ' + modelName, function () {
            //Do the binding.
            $sailsBind.bind(modelName, $rootScope);
            $timeout.flush();
            expect($rootScope[modelName + 's']).to.be.an("array");
        });
        it('should load the model with the contents from the backend', function () {
            //Do the binding.
            $sailsBind.bind(modelName, $rootScope);

            $timeout.flush();

            expect($rootScope[modelName + 's']).to.deep.equal(defaultData);
        });

        it('should update the model when a new element is ADDED in the backend', function () {
            //Do the binding.
            $sailsBind.bind(modelName, $rootScope);

            angular.extend(newData, {'id': '3'});
            io.socket.triggerOn(modelName, 'created', newData);
            $timeout.flush();
            expect($rootScope[modelName + 's']).to.have.length(3);
        });

        it('should update the model when an  element is DELETED in the backend', function () {
            var removedData = {'id': 2};

            //Do the binding
            $sailsBind.bind(modelName, $rootScope);

            $timeout.flush();

            //Setup so that the item #2 is not returned in "get all" requests.
            io.socket.when.get["/" + modelName] =
            { return: {'id': '1', 'modelAttribute1': "string", 'modelAttribute2': 'another string'}
            };

            //Setup so that nothing is returned when specifically asking for item #2
            io.socket.when.get["/" + modelName + "?id=" + removedData.id ] = {return: {error: "id not found"}};

            //Simulate someone has deleted item 2 in the database.
            io.socket.triggerOn(modelName, 'destroyed', removedData, removedData.id);
            $timeout.flush();
            expect($rootScope[modelName + 's']).to.have.length(1);
        });


        it('should update the model when an is MODIFIED in the backend', function () {
            var modifiedItem = {'id': '2', 'modelAtrribute1': "4", 'modelAttribute2': 'not10'};

            //Do the binding
            $sailsBind.bind(modelName, $rootScope);

            $timeout.flush();

            //Simulate someone has modified item 2 in the database.
            io.socket.triggerOn(modelName, 'updated', modifiedItem, modifiedItem.id);
            $timeout.flush();

            expect($rootScope[modelName + 's'][1]).to.deep.equal(modifiedItem);
        });

        it('should persist in the backend when a new element is ADDED in the client', function () {
            var newElementCreatedInClient = {name: "newElement"},
                newElementAsReturnedByBackend = {id: 3, name: "newElement"};

            //Do the binding
            $sailsBind.bind(modelName, $rootScope);
            $timeout.flush();

            //Setup the socket mock to return the newly created item
            io.socket.when.put["/" + modelName + "/create/"] = {return: newElementAsReturnedByBackend};

            //Setup so that the backend returns the newly created item with the id.
            io.socket.when.get["/" + modelName + "/" + newElementAsReturnedByBackend.id] = {
                return: newElementAsReturnedByBackend
            };


            $rootScope[modelName + 's'].push(newElementCreatedInClient);
            $rootScope.$apply();
            $timeout.flush();
            expect(io.socket.putCalled.data).to.deep.equal(newElementCreatedInClient);
            expect(io.socket.putCalled.url).to.equal("/" + modelName + "/create/");
            expect($rootScope[modelName + 's'][2]).to.deep.equal(newElementAsReturnedByBackend);
        });

        it('should persist in the backend when an element is REMOVED in the client', function () {
            //Do the binding
            $sailsBind.bind(modelName, $rootScope);
            $timeout.flush();

            var removedData = $rootScope[modelName + 's'].pop();

            //Setup backend to simulate the item wasn't removed there yet.
            io.socket.when.get["/" + modelName + "?id=" + removedData.id] = {return: removedData};

            //Setup the socket mock to return the id of the deleted item
            io.socket.when.delete["/" + modelName + "/destroy/" + removedData.id] = {return: removedData};

            $rootScope.$apply();
            $timeout.flush();
            //expect(io.socket.putCalled.data).to.deep.equal(newElement);
            expect(io.socket.deleteCalled.url).to.equal("/" + modelName + "/destroy/" + removedData.id);

        });
//        it('should persist in the backend when a new element is MODIFIED in the client', function () {
//            $sailsBind.bind(modelName, $rootScope).then(function () {
//                $rootScope[modelName + 's'][0].modelAttribute1 = "another string";
//                done();
//            })
//        });
    });
});