var gulp = require('gulp');
var postcss = require('gulp-postcss');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var autoprefixer = require('autoprefixer');
var colorFunction = require('postcss-color-function');
var hexrgba = require('postcss-hexrgba');
var processes = [
  require('postcss-import'),
  require('postcss-mixins'),
  require('postcss-simple-vars'),
  hexrgba(),
  colorFunction(),
  autoprefixer({browsers: ['last 1 version']})
];

gulp.task('css', function () {
  return gulp.src('common.css')
    .pipe(postcss(processes))
    .pipe(gulp.dest('asset'));
});

gulp.task('js', function(done) {
  return browserify()
    .add('common.js')
    .bundle()
    .pipe(source('common.js'))
    .pipe(gulp.dest('asset'));
});
