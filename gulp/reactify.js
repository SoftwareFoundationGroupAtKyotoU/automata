var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var error = require('./error');

module.exports = function(entries, dest, isWatch) {
    var compiled_msg = 'compiled '
        + entries.map(function(x) {
            return "'" + x + "'"
        }).join(', ')
        + ': ';
    var opt = {
        entries: entries,
        transform: ['reactify']
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
                .pipe(gulp.dest(dest));
        }
        bundler.on('update', bundle);
        return bundle();
    };
};
