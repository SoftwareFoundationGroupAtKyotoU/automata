var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

module.exports = function() {
    var depends = ['js/compatibility.js', 'js/util.js', 'js/uri.js',
                   'js/xhr.js', 'js/ui.js', 'js/account/msg.js'];
    gulp.src(depends.concat(['js/account/msg.js']))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/account'));
};
