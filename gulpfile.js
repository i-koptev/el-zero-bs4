const { watch, series, parallel, src, dest } = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const csso = require('gulp-csso');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const uglifycss = require('gulp-uglifycss');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const pngquant = require('imagemin-pngquant');

/* ----------- copyAllHtml ------------ */

function copyAllHtml() {
    return src('./src/*.html')
        .pipe(dest('public'))
        .on('end', browserSync.reload);
}
/* ----------- copyAllHtmlBuild ------------ */

function copyAllHtmlBuild() {
    return src('./src/*.html').pipe(dest('build'));
}

/* ----------- delPublic ----------- */

function delPublic() {
    return del('./public');
}

/* ----------- delBuild ----------- */

function delBuild() {
    return del('./build');
}

/* ----------- copyAndMinifyAllImages ------------ */

function copyAndMinifyAllImages() {
    return src('./src/img/**/*.{jpg,png,svg}')
        .pipe(
            imagemin([
                imagemin.jpegtran({ progressive: true }),
                imageminJpegRecompress({
                    loops: 5,
                    min: 65,
                    max: 75,
                    quality: 'medium',
                }),
                imagemin.optipng({ optimizationLevel: 3 }),
                pngquant({ quality: [0.65, 0.7], speed: 5 }),
                imagemin.svgo(),
            ]),
        )
        .pipe(dest('./public/img'))
        .on('end', browserSync.reload);
}

/* ----------- copyAndMinifyAllImagesBuild ------------ */

function copyAndMinifyAllImagesBuild() {
    return src('./src/img/**/*.{jpg,png,svg}')
        .pipe(
            imagemin([
                imagemin.jpegtran({ progressive: true }),
                imageminJpegRecompress({
                    loops: 5,
                    min: 65,
                    max: 75,
                    quality: 'medium',
                }),
                imagemin.optipng({ optimizationLevel: 3 }),
                pngquant({ quality: [0.65, 0.7], speed: 5 }),
                imagemin.svgo(),
            ]),
        )
        .pipe(dest('./build/img'));
}

/* -------- styles --------------- */

function styles() {
    return src('./src/sass/styles.scss', { sourcemaps: true })
        .pipe(plumber())
        .pipe(
            sass({
                outputStyle: 'expanded',
                indentType: 'space',
                indentWidth: '4',
            }).on('error', sass.logError),
        )
        .pipe(dest('./public/css', { sourcemaps: true }))
        .pipe(browserSync.stream());
}

/* -------- stylesBuild --------------- */

function stylesBuild() {
    return (
        src('./src/sass/styles.scss')
            .pipe(plumber())
            .pipe(sass().on('error', sass.logError))
            .pipe(postcss([autoprefixer('last 2 versions', '> 1%')]))
            .pipe(csso())
            .pipe(
                uglifycss({
                    maxLineLen: 80,
                    uglyComments: true,
                }),
            )
            .pipe(dest('./build/css'))
            .pipe(browserSync.stream())
    );
}

/* ----------- scripts -------------- */

function scripts() {
    return (
        src(
            [
                './src/js/**/*.js',
                './node_modules/jquery/dist/jquery.min.js',
                './node_modules/popper.js/dist/popper.min.js',
                './node_modules/bootstrap/dist/js/bootstrap.min.js',
            ],
            { sourcemaps: true },
        )
            .pipe(plumber())
            .pipe(babel({ presets: ['@babel/preset-env'] }))
            .pipe(dest('./public/js', { sourcemaps: true }))
            .pipe(browserSync.stream())
    );
}

/* ----------- scriptsBuild -------------- */

function scriptsBuild() {
    return (
        src([
            './src/js/**/*.js',
            './node_modules/jquery/dist/jquery.min.js',
            './node_modules/popper.js/dist/popper.min.js',
            './node_modules/bootstrap/dist/js/bootstrap.min.js',
        ])
            .pipe(plumber())
            .pipe(babel({ presets: ['@babel/preset-env'] }))
            .pipe(uglify())
            .pipe(dest('./build/js'))
    );
}

/* ------------- serve -------------------- */

function serve() {
    browserSync.init({
        notify: false,
        server: {
            baseDir: './public',
        },
    });
    watch('./src/sass/**/*.scss', styles);
    watch('./src/*.html', copyAllHtml);
    watch('./src/js/**/*.js', scripts);
    watch('./src/img/**/*.{png,svg,jpg}', copyAndMinifyAllImages);
}

exports.build = series(
    delBuild,
    parallel(
        stylesBuild,
        scriptsBuild,
        copyAllHtmlBuild,
        copyAndMinifyAllImagesBuild,
    ),
);
exports.develop = series(
    delPublic,
    parallel(styles, scripts, copyAllHtml, copyAndMinifyAllImages),
    serve,
);

exports.clean = parallel(delBuild, delPublic);