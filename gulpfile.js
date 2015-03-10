var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('watch', function() {
    gulp.watch('js/**/*.js', 'build');
});

gulp.task('build', ['account', 'admin', 'post', 'record']);

gulp.task('account', function() {
    var depends = ['js/compatibility.js', 'js/util.js', 'js/uri.js',
                   'js/xhr.js', 'js/ui.js', 'js/account/msg.js'];
    gulp.src(depends.concat(['js/account/msg.js']))
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/account'));
    gulp.src(depends.concat(['js/account/register_msg.js']))
        .pipe(concat('register.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/account'));
});

gulp.task('admin', function() {
    var jsFiles = ['js/jquery-1.11.2.min.js', 'js/jquery.blockUI.min.js',
                  'js/admin/admin.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/admin'));
});

gulp.task('post', function() {
    var jsFiles = ['js/compatibility.js', 'js/util.js', 'js/uri.js',
                   'js/xhr.js', 'js/ui.js', 'js/common.js', 'js/post/app.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/post'));
});

gulp.task('record', function() {
    var jsFiles = ['js/compatibility.js', 'js/util.js', 'js/uri.js',
                   'js/xhr.js', 'js/ui.js', 'js/file_browser.js',
                   'js/common.js', 'js/record/admin.js', 'js/record/model.js',
                   'js/record/keymap.js', 'js/record/view.js', 'js/record/tabs.js',
                   'js/record/app.js'];
    gulp.src(jsFiles)
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/record'));
});
