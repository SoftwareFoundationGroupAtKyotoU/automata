var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

module.exports = function() {
    browserify({
        'entries': ['js/record2/record.js'],
        'transform': ['reactify', 'debowerify']
    })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('public/record2'));
};
