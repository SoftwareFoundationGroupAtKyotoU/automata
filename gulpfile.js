var gulp = require('./gulp')([
    'account',
    'admin',
    'post',
    'record',
    'watch'
]);

gulp.task('build', ['account', 'admin', 'post', 'record']);
gulp.task('default', ['build', 'watch']);
