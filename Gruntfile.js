/*global module:false*/
/*global process:false*/
module.exports = function (grunt) {
    var browsers = [{
        browserName: "firefox",
        version: "19",
        platform: "XP"
    }, {
        browserName: "chrome",
        platform: "XP"
    }, {
        browserName: "chrome",
        platform: "linux"
    }, {
        browserName: "internet explorer",
        platform: "WIN8",
        version: "10"
    }, {
        browserName: "internet explorer",
        platform: "VISTA",
        version: "9"
    }, {
        browserName: "opera",
        platform: "Windows 2008",
        version: "12"
    }];
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    jsdoc : {
      dist : {
          src: ['lib/*.js', 'test/*.js'],
          options: {
              destination: 'doc'
          }
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['lib/<%= pkg.name %>.js', 'lib/utils.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    bump: {
        options: {
            commitFiles: ['-a'],
            files: ['package.json', 'bower.json'],
            pushTo: 'origin'
        }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {}
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
      karma: {
          unit: {
              configFile: 'karma.config.js'
          }
      },
      coveralls: {
          options: {
              debug: true,
              coverage_dir: 'test/coverage',
              dryRun: false,
              force: true,
              recursive: true
          }
      },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile','karma']
      }
    },
      connect: {
          server: {
              options: {
                  base: "",
                  port: 9999
              }
          }
      },
      'saucelabs-mocha': {
          all: {
              options: {
                  urls: ["http://127.0.0.1:9999/test-mocha/test/browser/opts.html"],
                  tunnelTimeout: 5,
                  build: process.env.CI_BUILD_NUMBER,
                  concurrency: 3,
                  browsers: browsers,
                  testname: "mocha tests",
                  tags: ["master"]
              }
          }
      }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-docular');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task.
  grunt.registerTask('default', ['docular', 'jshint', 'concat', 'uglify', 'karma', 'coveralls']);
  grunt.registerTask('test', ["connect", "saucelabs-mocha",'coveralls']);
  grunt.registerTask('release', ['default','bump']);
};
