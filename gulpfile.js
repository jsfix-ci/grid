var settings = {
  isLocal: true,
  assetDest: 'asset/',
  watch: {
    css: 'css/**/*.css',
    js: 'js/**/*.js'
  },
  nodeModules: 'node_modules/',
  jsLibs: [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/mustache/mustache.js'
  ],
  css: 'css/',
  js: 'js/',
  media: ['media/']
};

var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpConcat = require('gulp-concat');
var tap = require('gulp-tap');
var runSequence = require('run-sequence');
var jscs = require('gulp-jscs');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var postcssImport = require('postcss-import');
var postcssCsscomb = require('postcss-csscomb');
var postcssCombOptions = require('./gulp/.csscomb.json');
var postcssColorFunction = require('postcss-color-function');
var postcssHexrgba = require('postcss-hexrgba');
var postcssConditionals = require('postcss-conditionals');
var postcssCustomProperties = require('postcss-custom-properties');
var postcssProcesses = [
  postcssImport,
  postcssCustomProperties(),
  postcssConditionals,
  postcssHexrgba(),
  postcssColorFunction(),
  autoprefixer({browsers: ['last 1 version']})
];
var browserify = require('browserify');
var buffer = require('gulp-buffer');

gulp.task('default', build);
gulp.task('watch', watch);
gulp.task('min', min);
gulp.task('css', css);
gulp.task('cssMin', cssMin);
gulp.task('cssTidy', cssTidy);
gulp.task('js', js);
gulp.task('jsLib', jsLib);
gulp.task('jsMin', jsMin);
gulp.task('jsTidy', jsTidy);
gulp.task('copy', copy);

function build() {
  runSequence(
    'jsLib',
    'js',
    'css',
    'jsMin',
    'cssMin',
    'copy'
  );
}

function min() {
  runSequence(
    'cssMin',
    'jsMin'
  );
}

function watch() {
  gulp.watch(settings.watch.css, ['css']);
  gulp.watch(settings.watch.js, ['js']);
}

function js() {
  return gulp.src(settings.js + '**/*.bundle.js', {read: false})
    .pipe(tap(function(file) {
      file.contents = browserify(file.path, {debug: settings.isLocal})
        .transform('browserify-shim', {global: true})
        .bundle();
      gutil.log('build ' + file.path);
    }))
    .pipe(buffer())
    .pipe(gulp.dest(settings.assetDest));
};

function css() {
  return gulp.src(settings.css + '**/*.bundle.css')
    .pipe(postcss(postcssProcesses))
    .pipe(tap(function(file) {
      gutil.log('build ' + file.path);
    }))
    .pipe(gulp.dest(settings.assetDest));
};

function cssMin() {
  return gulp.src(settings.assetDest + '**/*.css')
    .pipe(cssmin())
    .pipe(tap(function(file) {
      gutil.log('minify ' + file.path);
    }))
    .pipe(gulp.dest(settings.assetDest));
}

function cssTidy() {
  return gulp.src(settings.css + '**/*.css')
    .pipe(postcss([postcssCsscomb(postcssCombOptions)]))
    .pipe(tap(function(file) {
      gutil.log('tidy ' + file.path);
    }))
    .pipe(gulp.dest('css'));
}

function jsLib() {
  gulp.src(settings.jsLibs)
    .pipe(tap(function(file) {
      gutil.log('concat ' + file.path);
    }))
    .pipe(gulpConcat('lib.js'))
    .pipe(gulp.dest(settings.assetDest));
}

function jsMin() {
  return gulp.src(settings.assetDest + '**.js')
    .pipe(uglify())
    .pipe(tap(function(file) {
      gutil.log('minify ' + file.path);
    }))
    .pipe(gulp.dest(settings.assetDest));
}

function jsTidy() {
  return gulp.src([settings.js + '**/*.js'])
    .pipe(jscs({
      configPath: 'gulp/.jsTidyGoogle.json',
      fix: true
    }))
    .pipe(gulp.dest('js'));
}

function copy() {}
