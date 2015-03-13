var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

module.exports = function() {
    browserify({'entries': ['./js/admin/admin.js']})
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('public/admin'));
};
