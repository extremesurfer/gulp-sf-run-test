/**
 * * Gulp task definition
 * * @author Satoshi Haga
 * * @date 2015/09/30
 **/
var gulp = require('gulp');
var babel = require('gulp-babel');

var sfTest = require('./run-sf-test');


gulp.task('babel', function(){
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('./'));
});

gulp.task('sf-test', function(){
    return gulp.src('./src/package.xml')
        .pipe(sfTest())
        .pipe(gulp.dest('./result/'));
});


gulp.task('default', ['babel']);
