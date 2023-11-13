const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');

const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const webpack = require('webpack-stream');
const del = require('del');
const mode = require('gulp-mode')();

const concat = require('gulp-concat');
const named = require('vinyl-named');
const insert = require('gulp-insert');

// const php2html = require("gulp-php2html");
// const htmlbeautify = require('gulp-html-beautify');
const fs = require('fs');
// clean tasks
const clean = () => {
    return del(['dist/assets', 'dist/css', 'dist/js']);
};

// css task
const css = () => {
    return src(['src/scss/*.scss', '!src/scss/pages/*.scss'])
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(concat('app.min.css'))
        .pipe(mode.production(csso()))
        .pipe(dest('dist/css'));
};

const css_page = () => {
    return src('src/scss/pages/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(
            rename(function (path) {
                return {
                    dirname: path.dirname,
                    basename: path.basename,
                    extname: '.min.css',
                };
            })
        )
        .pipe(mode.production(csso()))
        .pipe(dest('dist/css'));
};

// js task
const js = () => {
    return src(['src/js/pages/*.js', 'src/js/dom/*.js'])
        .pipe(named())
        .pipe(
            babel({
                presets: ['@babel/env'],
                plugins: ['@babel/plugin-proposal-optional-chaining'],
            })
        )
        .pipe(
            webpack({
                mode: 'development',
                devtool: 'inline-source-map',
            })
        )
        .pipe(
            rename(function (path) {
                return {
                    dirname: path.dirname,
                    basename: path.basename,
                    extname: '.min.js',
                };
            })
        )
        .pipe(mode.production(terser({ output: { comments: false } })))
        .pipe(dest('dist/js'));
};

// copy tasks
const copyAssets = () => {
    return src('src/assets/**/*').pipe(dest('dist/assets'));
};

// php to html
// const phpGenerator = () => {
//     return src(['php/**/*.php', '!php/include_html/**/*'])
//         .pipe(php2html())
//         .pipe(htmlbeautify())
//         .pipe(dest('dist'));
// };

const customselect = () => {
    const fileName = 'customselect';
    return src(`src/js/components/${fileName}.js`)
        .pipe(named())
        .pipe(
            rename(function (path) {
                return {
                    dirname: path.dirname,
                    basename: fileName,
                    extname: '.min.js',
                };
            })
        )
        .pipe(mode.production(terser({ output: { comments: false } })))
        .pipe(dest('./'))
        .pipe(insert.append(`
if (typeof document !== "undefined") {
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.innerHTML = \`` + fs.readFileSync('./customselect.min.css') + `\`
}
        `))
        .pipe(
            rename(function (path) {
                return {
                    dirname: path.dirname,
                    basename: fileName,
                    extname: '.all.min.js',
                };
            })
        )
        .pipe(dest('./'));
}

const customselect_css = () => {
    return src('src/scss/components/customselect.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(
            rename(function (path) {
                return {
                    dirname: path.dirname,
                    basename: path.basename,
                    extname: '.min.css',
                };
            })
        )
        .pipe(mode.production(csso()))
        .pipe(dest('./'));
}

// watch task
const watchForChanges = () => {
    watch('src/scss/**/*.scss', css);
    watch('src/scss/**/*.scss', css_page);
    // watch('php/**/*.php', phpGenerator);
    watch('src/**/*.js', js);
    watch('src/assets/**/*', copyAssets);
    watch('src/scss/components/customselect.scss', customselect_css);
    watch('src/js/components/customselect.js', customselect);
};

// public tasks
exports.default = series(clean, parallel(css, css_page, js, copyAssets), customselect_css, customselect, watchForChanges);
exports.build = series(clean, parallel(css, css_page, js, copyAssets), customselect_css, customselect);
