var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

module.exports = function() {
    var jsFiles = ['js/jquery-1.11.2.min.js', 'js/jquery.blockUI.min.js',
                  'js/admin/admin.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/admin'));
};
