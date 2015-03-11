var gulp = require('gulp');

module.exports = function() {
    gulp.watch('js/**/*.js', ['build']);
};
