/**
 * Created by dpamio on 30/05/14.
 */
var io = {
    socket: {
        data: {},
        when: {
            put: {},
            get: {}
        },
        callbacks: [],
        callback: {},
        request: function (url, additional, cb) {
            var self = this;
            setTimeout(function() {
                cb(self.when.get[url].return);
            },10);

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
            setTimeout(function() {
                self.callback.callback({verb: verb, data: data, id: id});
                $rootScope.$apply(defer.resolve());
            }, 10);
            return defer.promise;
        },
        put: function (url, data, callback) {
            var self = this;
            setTimeout(function () {
                callback(self.when.put[url].return);
            }, 10)
        }
    }
};