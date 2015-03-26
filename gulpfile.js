var gulp = require('gulp');

function watch(s) {
    return s + '.watch';
}

var old = ['account'];
old.forEach(function(name) {
    gulp.task(name, require('./gulp/tasks/' + name));
    gulp.task(watch(name), [name], function() {
        gulp.watch('js/{' + name + ',gnn}/**/*.js', [name]);
    });
});

var modern = ['admin', 'post', 'record'];
modern.forEach(function(name) {
    gulp.task(name, require('./gulp/tasks/' + name)(false));
    gulp.task(watch(name), require('./gulp/tasks/' + name)(true));
});

var deps = old.concat(modern);
gulp.task('build', deps);
gulp.task('watch', deps.map(watch));
gulp.task('default', ['watch']);
