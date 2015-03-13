var gulp = require('./gulp')([
    'account',
    'admin',
    'post',
    'record',
    'record2',
    'watch'
]);

gulp.task('build', ['account', 'admin', 'post', 'record', 'record2']);
gulp.task('default', ['build', 'watch']);
