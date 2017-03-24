module.exports = function (grunt) {
    // Do grunt-related things in here

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            default: {
                src: [
                    '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js',
                    '<%= pkg.grunt.build.path %>/*'
                ]
            }
        },

        browserify: {
            default: {
                options: {
                    browserifyOptions: {
                        debug: true
                    }
                },
                src: ['<%= pkg.grunt.src.path %>/debug.js', '<%= pkg.grunt.src.path %>/<%= pkg.grunt.src.script %>'],
                dest: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js'
            },
            build: {
                src: ['<%= pkg.grunt.src.path %>/<%= pkg.grunt.src.script %>'],
                dest: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js'
            }
        },

        exorcise: {
            default: {
                options: {
                    url: "http://localhost:63344/lint-neo-yt/src/app.map",
                    root: "../",
                    base: "../",
                    strict: true
                },
                files: {
                    'src/app.map': ['src/app.js']
                }
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            default: {
                src: [],
                dest: []
            },
            build: {
                src: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js',
                dest: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js'
            }
        },

        copy: {
            default: {
                files: [
                    {
                        src: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.script %>.js',
                        dest: '<%= pkg.grunt.build.path %>/<%= pkg.grunt.build.script %>.js'
                    },
                    {
                        src: '<%= pkg.grunt.src.path %>/<%= pkg.grunt.build.html %>',
                        dest: '<%= pkg.grunt.build.path %>/<%= pkg.grunt.build.html %>'
                    }
                ]
            }
        },

        cachebreaker: {
            default: {
                options: {
                    match: ['app.js'],
                    replacement: 'time'
                },
                files: {
                    src: ['<%= pkg.grunt.build.path %>/<%= pkg.grunt.build.html %>']
                }
            }
        }
    });

    // Load the plugins.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-exorcise');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-cache-breaker');

    // Default task(s).
    grunt.registerTask('default', ['clean', 'browserify:default', 'exorcise:default', 'copy', 'cachebreaker']);
    grunt.registerTask('build', ['clean', 'browserify:build', 'uglify:build', 'copy', 'cachebreaker']);

};
