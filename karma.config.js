// Karma configuration
// Generated on Thu May 29 2014 22:32:20 GMT-0300 (ART)

module.exports = function(config) {
    var customLaunchers = {
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
        sl_ios_safari: {
            base: 'SauceLabs',
            browserName: 'iphone',
            platform: 'OS X 10.9',
            version: '7.1'
        },
        sl_ie_11: {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 8.1',
            version: '11'
        }
    };
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
      'karma-sauce-launcher'
    ],
    preprocessors : {
        'lib/*.js': 'coverage'
    },
    // list of files / patterns to load in the browser
    files: [
        'lib/dependencies/angular/*.js',
        'lib/dependencies/angular-mocks/*.js',
        'test/mocks/*.js',
        'lib/*.js',
        'test/**/*Spec.js'
    ],

    // list of files to exclude
    exclude: [
      
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['coverage', 'mocha', 'html', 'saucelabs'],
    htmlReporter: {
      outputFile: 'test/report/resuts.html'
    },
    coverageReporter : {
        type : 'lcov',
        dir : 'test/coverage'
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
    browsers: ['Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
