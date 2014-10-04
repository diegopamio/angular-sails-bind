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
        callback: {},
        get: function (url, additional, cb) {
            var self = this;

            $timeout(function () {
                if (cb) {
                    cb(self.when.get[url].return);
                }
            });
            self.requestCalled = {url: url, additional: additional};

        },
        on: function (modelName, callback) {
            this.callback = {what: modelName, callback: callback};
        },
        triggerOn: function (modelName, verb, data, id) {
            var defer = new $q.defer(),
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

            if (callback) {
                $timeout(function () {
                    callback(self.when.post[url].return);
                });
            }
            self.postCalled = {url: url, data: data};
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