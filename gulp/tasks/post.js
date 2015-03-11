var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

module.exports = function() {
    var jsFiles = ['js/compatibility.js', 'js/util.js', 'js/uri.js',
                   'js/xhr.js', 'js/ui.js', 'js/common.js', 'js/post/app.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/post'));
};
