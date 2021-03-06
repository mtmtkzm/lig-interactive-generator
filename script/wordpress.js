#!/usr/bin/env node
'use strict';
const promise = require('promise');
const childProcess = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');

const download = require('../util/download');
const preparing = ora(`[preparing]`);
const rootDir = (process.argv[2] === 'true') ? path.join(process.cwd(), 'lig-interactive-generator') : path.join(process.cwd());

const defaultPHPVersion = '7.3.6';
const defaultMySQLVersion = '8.0.16';

inquirer.prompt([{
    name: 'name',
    message: 'Type theme name',
    type: 'input',
},{
    name: 'wordpress_ver',
    message: 'Type WordPress version (Empty will be "latest")',
    type: 'input',
},{
    name: 'php_ver',
    message: 'Type PHP version (Empty will be "'+defaultPHPVersion+'")',
    type: 'input',
},{
    name: 'mysql_ver',
    message: 'Type MySQL version (Empty will be "'+defaultMySQLVersion+'")',
    type: 'input',
}]).then((answer) => {
    const thePromise = Promise.resolve();
    thePromise
        .then(function () {
            download('https://github.com/liginc/lig-docker-wordpress.git', 'master', false, false, false, true);
        })
        .then(function () {
            download('https://github.com/liginc/laravel-mix-boilerplate-wordpress.git', 'master', false, true, true, true);
        })
        .then(function () {
            download('https://github.com/liginc/lig-wordpress-template.git', 'master', 'wp/wp-content/themes/lig', false);
        })
        .then(function () {
            preparing.start();
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|!/wp/wp-content/themes/lig/|!/wp/wp-content/themes/" + answer.name + "/|g", path.join(rootDir, ".gitignore")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|'input-theme-name'|'" + answer.name + "'|g", path.join(rootDir, "webpack.mix.js")]);
            childProcess.spawnSync('mv', [path.join(rootDir, "wp/wp-content/themes/input-theme-name/inc"), path.join(rootDir, "wp/wp-content/themes/lig/")]);
            childProcess.spawnSync('rm', ["-Rf", path.join(rootDir, "wp/wp-content/themes/input-theme-name")]);
            fs.renameSync(path.join(rootDir, 'resources/themes/input-theme-name'), path.join(rootDir, 'resources/themes', answer.name));
            fs.renameSync(path.join(rootDir, 'wp/wp-content/themes/lig'), path.join(rootDir, 'wp/wp-content/themes', answer.name));

            // Edit .env
            const PHP_VER = ( answer.php_ver === '' ) ? defaultPHPVersion : answer.php_ver;
            const MYSQL_VER = ( answer.mysql_ver === '' ) ? defaultMySQLVersion : answer.mysql_ver;
            const WP_VER = ( answer.wordpress_ver === '' ) ? 'latest' : answer.wordpress_ver;
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|PHP_VER=7.3.6|PHP_VER=" + PHP_VER + "|g", path.join(rootDir, ".env")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|MYSQL_VER=8.0.16|MYSQL_VER=" + MYSQL_VER + "|g", path.join(rootDir, ".env")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_VERSION=latest|WP_VERSION=" + WP_VER + "|g", path.join(rootDir, ".env")]);
            childProcess.spawnSync('sed', ["-i", "", "-e", "s|WP_THEME_NAME=lig|WP_THEME_NAME=" + answer.name + "|g", path.join(rootDir, ".env")]);

            preparing.succeed();
        });
});
