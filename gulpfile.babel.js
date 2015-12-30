/**
 * * Gulp task definition
 * * @author Satoshi Haga
 * * @date 2015/09/30
 **/
var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('babel', function(){
    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('./build/'));
});

gulp.task('default', ['babel']);