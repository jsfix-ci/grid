var gulp = require('gulp');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var eventStream = require('event-stream');
var glob = require('glob');
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
  return gulp.src('**.bundle.css')
    .pipe(postcss(processes))
    .pipe(rename(function (pathObject) {
      pathObject.basename = pathObject.basename.replace('.bundle', '');
    }))
    .pipe(gulp.dest('asset'));
});

gulp.task('js', function(done) {
  glob('**.bundle.js', function(err, files) {
    if (err) {
      done(err);
    };
    var tasks = files.map(function(entry) {
      return browserify({
        entries: [entry],
        paths: [
          '.'
        ]
      })
      .bundle()
      .pipe(source(entry.replace('js/', '').replace('.bundle', '')))
      .pipe(gulp.dest('asset'));
    });

    // create a merged stream
    eventStream.merge(tasks).on('end', done);
  });
});
