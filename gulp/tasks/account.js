var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

module.exports = function() {
    var depends = ['js/gnn/compatibility.js', 'js/gnn/util.js', 'js/gnn/uri.js',
                   'js/gnn/xhr.js', 'js/gnn/ui.js', 'js/account/msg.js'];
    gulp.src(depends.concat(['js/account/msg.js']))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/account'));
};
