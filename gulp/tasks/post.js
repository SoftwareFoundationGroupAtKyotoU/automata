var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

module.exports = function() {
    var jsFiles = ['js/gnn/compatibility.js', 'js/gnn/util.js', 'js/gnn/uri.js',
                   'js/gnn/xhr.js', 'js/gnn/ui.js', 'js/gnn/common.js', 'js/post/app.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/post'));
};
