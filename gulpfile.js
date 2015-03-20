var gulp = require('./gulp')([
    'account',
    'admin',
    'post',
    'post2',
    'record',
    'record2',
    'watch'
]);

gulp.task('build', ['account', 'admin', 'post', 'post2', 'record', 'record2']);
gulp.task('default', ['build', 'watch']);
