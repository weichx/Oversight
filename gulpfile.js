var gulp = require('gulp');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var wrap = require('gulp-wrap');
var istanbul = require('gulp-istanbul');


var src = [
    'src/util.js',
    'src/oversight.js',
    'src/*.js'
];

var build = function(files, templateName, dest, outputName, async) {
    var stream = gulp.src(files)
        .pipe(concat(outputName + '.js', {newLine: '\n\n'}))
        .pipe(wrap({src: './templates/' + templateName + '.lo_dash'}))
        .pipe(gulp.dest(dest));
    return (async) ? stream : undefined;
};

gulp.task('build-global', function() {
    build(src, 'global-wrapper', './dist', 'oversight-global');
});

gulp.task('build-amd', function() {
    build(src, 'amd-wrapper', './dist', 'oversight-amd');
});

gulp.task('build-common', function() {
    build(src, 'common-wrapper', './dist', 'oversight-common');
});

gulp.task('build-test', function() {
    return build(src, 'test-common-wrapper', './dist', 'oversight-test', true);
});

gulp.task('build-all', ['build-global', 'build-amd', 'build-common', 'build-test']);

gulp.task('clean', function() {
    gulp.src('./dist')
        .pipe(clean({force: true}));
});

gulp.task('test', ['build-test'], function() {
    gulp.src('./test/*.js')
        .pipe(mocha({reporter: 'progress'}));
});

gulp.task('cover', ['build-test'], function (cb) {
    gulp.src('./dist/oversight-test.js')
        .pipe(istanbul())
        .on('end', function () {
            gulp.src('test/*.js')
                .pipe(mocha())
                .pipe(istanbul.writeReports())
                .on('end', cb);
        });
});

gulp.task('default', ['build-all', 'test']);


