/*global module:false*/
/*global process:false*/
// Karma configuration
// Generated on Thu May 29 2014 22:32:20 GMT-0300 (ART)

module.exports = function (config) {
    'use strict';
    var environment = process.env.NODE_ENV || 'dev',
        customLaunchersByEnvironment = {
            test: {
                sl_chrome: {
                    base: 'SauceLabs',
                    browserName: 'chrome',
                    platform: 'Windows 7'
                },
                sl_firefox: {
                    base: 'SauceLabs',
                    browserName: 'firefox',
                    version: '27'
                },
                sl_ie_11: {
                    base: 'SauceLabs',
                    browserName: 'internet explorer',
                    platform: 'Windows 8.1',
                    version: '11'
                }
            },
            dev: {
                chrome_without_security: {
                    base: 'Chrome',
                    flags: []
                },
                phantom: {
                    base: 'PhantomJS',
                    flags: []
                }
            }
        },
        customLaunchers = customLaunchersByEnvironment[environment],
        reportersByEnvironment = {
            test: ['coverage', 'mocha', 'html', 'saucelabs'],
            dev: ['mocha']
        },
        reporters = ['progress'],
        //reporters = reportersByEnvironment[environment],
        browsersByEnvironment = {
            test: Object.keys(customLaunchers),
            dev: ['phantom']
        },
        browsers = browsersByEnvironment[environment];



    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',


        // frameworks to use
        frameworks: ['mocha', 'chai', 'chai-as-promised'],

        plugins: [
            'karma-mocha',
            'karma-chrome-launcher',
            'karma-junit-reporter',
            'karma-chai',
            'karma-chai-plugins',
            'karma-coverage',
            'karma-mocha-reporter',
            'karma-htmlfile-reporter',
            'karma-sauce-launcher',
            'karma-phantomjs-launcher'
        ],
        preprocessors: {
            'lib/angular-sails-bind.js': 'coverage'
        },
        // list of files / patterns to load in the browser
        files: [
            'lib/dependencies/angular/angular.js',
            'lib/dependencies/angular-mocks/angular-mocks.js',
            'test/mocks/*.js',
            'lib/ngSailsBind.module.js',
            'lib/$sailsBindHelper.factory.js',
            'lib/$sailsBind.factory.js',
            'test/**/*Spec.js'
        ],

        // list of files to exclude
        exclude: [

        ],

        sauceLabs: {
            testName: process.env.CI_MESSAGE || 'Web App Unit Tests',
            build: process.env.CI_BUILD_NUMBER
        },
        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: reporters,

        htmlReporter: {
            outputFile: 'test/report/resuts.html'
        },
        coverageReporter: {
            type: 'lcov',
            dir: 'test/coverage'
        },

        mochaReporter: {
            output: 'full'
        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
        customLaunchers: customLaunchers,
        browsers: browsers,


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};
