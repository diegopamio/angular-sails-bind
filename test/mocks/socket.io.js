/**
 * Created by dpamio on 30/05/14.
 */
var io = {
    socket: {
        data: {},
        when: {
            put: {},
            get: {},
            delete: {},
            post: {}
        },
        callback: {},
        get: function (url, additional, callback) {
            var self = this;

            $timeout(function () {
                if (callback) {
                    var resData = {};
                    var jwres = {};

                    if(self.when.get.hasOwnProperty(url)){
                        resData = self.when.get[url].return || {};
                        jwres = self.when.get[url].jwres || {}
                    }
                    callback(resData, jwres);  
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
            if (callback) {
            $timeout(function () {
                    var resData = {};
                    var jwres = {};

                    if(self.when.put.hasOwnProperty(url)){
                        resData = self.when.put[url].return || {};
                        jwres = self.when.put[url].jwres || {}
                    }
                    callback(resData, jwres);  
                });
            }
            self.putCalled = {url: url, data: data};
        },
        post: function (url, data, callback) {
            var self = this;

            if (callback) {
                $timeout(function () {
                    var resData = {};
                    var jwres = {};

                    if(self.when.post.hasOwnProperty(url)){
                        resData = self.when.post[url].return || {};
                        jwres = self.when.post[url].jwres || {}
                    }

                    callback(resData, jwres);  
                });
            }
            self.postCalled = {url: url, data: data};
        },
        delete: function (url, callback) {
            var self = this;
            if (callback) {
                $timeout(function () {
                    var resData = {};
                    var jwres = {};

                    if(self.when.delete.hasOwnProperty(url)){
                        resData = self.when.delete[url].return || {};
                        jwres = self.when.delete[url].jwres || {}
                    }

                    callback(resData, jwres);  
                });
            }
            self.deleteCalled = {url: url};
        }

    }
};