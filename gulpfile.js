var gulp = require('gulp');

function watch(s) {
    return s + '.watch';
}

var pages = ['account', 'admin', 'post', 'record'];
pages.forEach(function(name) {
    gulp.task(name, require('./gulp/tasks/' + name)(false));
    gulp.task(watch(name), require('./gulp/tasks/' + name)(true));
});

gulp.task('build', pages);
gulp.task('watch', pages.map(watch));
gulp.task('default', ['watch']);
