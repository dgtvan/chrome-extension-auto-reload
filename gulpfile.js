const gulp = require('gulp');
const browserify = require('gulp-browserify');
const fs = require('fs');
const template = require('gulp-template');
const zip = require('gulp-zip');
const marked = require('gulp-marked'); // Replace gulp-markdown with gulp-marked
const del = require('del'); // Compatible CommonJS version of del

/*
 * Task Name    Description
 * ---------------------------------------------------------------------
 * default      Create full build and distribution zip file
 * build        Create a full build with images and manifest files in /build/ that can be loaded as an unpacked extension
 * build-code   Build all code files (JavaScript and JSON) into the /build/ folder
 * bundle-js    Bundle the source javascript files to /build/js/background.js
 * dist         Create a zip distribution file in /dist/ that can be uploaded to the Chrome web store
 * watch        Create a full build and automatically rebuild code files when changes are detected
 */

/**
 * Helper function to get package details from package.json
 */
function getPackageDetails() {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
}

/**
 * Task: Clean build directory
 */
function clean() {
  return del(['build']);
}

/**
 * Task: Copy images to build directory
 */
function copyImages() {
  return gulp.src('./src/img/icons/*.*')
    .pipe(gulp.dest('./build/img/icons'))
    .on('end', () => console.log('Images copied from /src/ to /build/'));
}

/**
 * Task: Process manifest and HTML files
 */
function processManifestAndHTML() {
  return gulp.src(['./src/manifest.json', './src/options.html'])
    .pipe(template(getPackageDetails()))
    .pipe(gulp.dest('./build'))
    .on('end', () => console.log('Chrome manifest file generated at /build/manifest.json'));
}

/**
 * Task: Bundle JavaScript files
 */
function bundleJS() {
  return gulp.src(['./src/js/background.js', './src/js/options.js'], { read: false })
    .pipe(browserify({
      debug: true
    }))
    .pipe(gulp.dest('./build/js'))
    .on('end', () => console.log('Source JavaScript files bundled to ./build/js/'));
}

/**
 * Task: Process Markdown files
 */
function processMarkdown() {
  return gulp.src('./src/**/*.md') // Adjust path to match your markdown files
    .pipe(marked())
    .pipe(gulp.dest('./build/docs')) // Output markdown as HTML
    .on('end', () => console.log('Markdown files processed and saved to ./build/docs'));
}

/**
 * Task: Watch for changes and rebuild
 */
function watchFiles() {
  console.log('Watching for changes in JavaScript, JSON, or HTML files...');
  gulp.watch('./src/**/*.js', gulp.series(buildCode));
  gulp.watch('./src/**/*.json', gulp.series(buildCode));
  gulp.watch('./src/**/*.html', gulp.series(buildCode));
  gulp.watch('./src/**/*.md', gulp.series(processMarkdown)); // Watch for markdown changes
  gulp.watch('./package.json', gulp.series(buildCode));
}

/**
 * Task: Package build directory into a zip file
 */
function createDist() {
  return gulp.src('build/**')
    .pipe(zip('chrome-extension.zip'))
    .pipe(gulp.dest('./dist'))
    .on('end', () => console.log('./build/ folder successfully packaged as ./dist/chrome-extension.zip'));
}

/**
 * Task: Build code (JS + manifest/HTML)
 */
const buildCode = gulp.series(bundleJS, processManifestAndHTML);

/**
 * Task: Full build (clean, build-code, copy images, process markdown)
 */
const build = gulp.series(clean, buildCode, copyImages, processMarkdown);

/**
 * Task: Watch for changes
 */
const watch = gulp.series(build, watchFiles);

/**
 * Task: Create a distribution zip
 */
const dist = gulp.series(build, createDist);

/**
 * Default task: Full build
 */
const defaultTask = build;

/**
 * Export tasks
 */
exports.clean = clean;
exports.copyImages = copyImages;
exports.bundleJS = bundleJS;
exports.processMarkdown = processMarkdown;
exports.buildCode = buildCode;
exports.build = build;
exports.watch = watch;
exports.dist = dist;
exports.default = defaultTask;
