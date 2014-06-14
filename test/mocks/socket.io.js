/**
 * Created by dpamio on 30/05/14.
 */
var io = {
    socket: {
        data: {},
        when: {
            put: {},
            get: {},
            delete: {}
        },
        callbacks: [],
        callback: {},
        request: function (url, additional, cb) {
            var self = this;
            $timeout(function() {
                cb(self.when.get[url].return);
            });

        },
        on: function (modelName, callback) {

//            this.callbacks.push({what: modelName, callback: callback});
            this.callback = {what: modelName, callback: callback};
        },
        triggerOn: function (modelName, verb, data, id) {
            var defer = new $q.defer(),
//                callbacks = this.callbacks.filter(function (item) {
//                return item.what = modelName;
//            });
//            if (callbacks.length > 0) {
//                callbacks.forEach(function (item) {
//                    setTimeout(function () {
//                        item.callback({verb: verb, data: data});
//                        defer.resolve();
//                    }, 10);
//                });
//
//            }
//            else {
//                setTimeout(function (item) {
//                    defer.resolve()
//                },10);
//            }

                self = this;
            $timeout(function() {
                self.callback.callback({verb: verb, data: data, id: id});
                $rootScope.$apply(defer.resolve());
            }, 10);
            return defer.promise;
        },
        put: function (url, data, callback) {
            var self = this;
            $timeout(function () {
                callback(self.when.put[url].return);
            });
            self.putCalled = {url: url, data: data};
        },
        post: function (url, data, callback) {
            var self = this;
            $timeout(function () {
                callback(self.when.post[url].return);
            });
            self.postCalled = true;
        },
        delete: function (url, callback) {
            var self = this;
            if (callback) {
                $timeout(function () {
                    callback(self.when.delete[url].return);
                });
            }
            self.deleteCalled = {url: url};
        }

    }
};