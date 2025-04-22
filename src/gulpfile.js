// Load Gulp and required plugins
const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync').create();

// Paths for files
const paths = {
  html: './src/*.html',
  css: './src/*.css',
  js: './src/*.js',
};

// Copy HTML to dist
function copyHtml() {
  return src(paths.html).pipe(dest(paths.dist)).pipe(browserSync.stream());
}

// Minify CSS
function minifyCss() {
  return src(paths.css)
    .pipe(concat('style.min.css'))
    .pipe(cleanCSS())
    .pipe(dest(`${paths.dist}/css`))
    .pipe(browserSync.stream());
}

// Minify and bundle JS
function minifyJs() {
  return src(paths.js)
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(dest(`${paths.dist}/js`))
    .pipe(browserSync.stream());
}

// Live server
function serve() {
  browserSync.init({
    server: {
      baseDir: paths.dist,
    },
  });

  watch(paths.html, copyHtml);
  watch(paths.css, minifyCss);
  watch(paths.js, minifyJs);
}

// Default task
exports.default = series(parallel(copyHtml, minifyCss, minifyJs), serve);
