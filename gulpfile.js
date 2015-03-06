var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function () {
  return gulp.src('./tests/**/*.test.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('seed', function () {
  return gulp.src('./seeds/seeder.js', {read: false})
    .pipe(mocha({reporter: 'nyan'}));
});
