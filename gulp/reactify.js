var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var error = require('./error');
var argv = require('yargs').argv;
var debug = !!(argv.debug);
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');

module.exports = function(entries, dest, isWatch) {
    var compiled_msg = 'compiled '
        + entries.map(function(x) {
            return "'" + x + "'"
        }).join(', ')
        + ': ';
    var opt = {
        entries: entries,
        transform: ['reactify'],
        debug: debug
    };
    return function() {
        var bundler;
        if (isWatch) {
            opt.cache = {};
            opt.packageCache = {};
            opt.fullPaths = true;
            bundler = watchify(browserify(opt));
            bundler.on('log', function(msg) { console.log(compiled_msg + msg) });
        } else {
            bundler = browserify(opt);
        }
        function bundle() {
            return bundler.bundle()
                .on('error', error)
                .pipe(source('bundle.js'))
                .pipe(gulpif(!debug, buffer()))
                .pipe(gulpif(!debug, uglify()))
                .pipe(gulp.dest(dest));
        }
        bundler.on('update', bundle);
        return bundle();
    };
};
