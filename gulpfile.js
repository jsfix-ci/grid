require('es6-promise').polyfill(); // could be required to fix postcss-import?
var gulp = require('gulp');
var gulpSrc = gulp.src;
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var postcss = require('gulp-postcss');
var postcssImport = require('postcss-import');
var postcssSimpleVars = require('postcss-simple-vars');
var postcssMixins = require('postcss-mixins');
var postcssColorFunction = require('postcss-color-function');
var postcssHexrgba = require('postcss-hexrgba');
var autoprefixer = require('autoprefixer');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var processes = [
  postcssImport,
  postcssMixins,
  postcssSimpleVars,
  postcssHexrgba(),
  postcssColorFunction(),
  autoprefixer({browsers: ['last 1 version']})
];
 
gulp.src = function() {
  return gulpSrc.apply(gulp, arguments)
    .pipe(plumber(function(error) {
      // Output an error message
      gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
      // emit the end event, to properly end the task
      this.emit('end');
    })
  );
};

gulp.task('css', function () {
  return gulp.src('common.css')
    .pipe(postcss(processes))
    .pipe(gulp.dest('asset'));
});

gulp.task('js', function(done) {
  return browserify({paths: ['.', 'node_modules']})
    .add('common.js')
    .bundle()
    .pipe(source('common.js'))
    .pipe(gulp.dest('asset'));
});
