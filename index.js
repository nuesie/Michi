#!/usr/bin/env node

let path   = require('path'),
    fs     = require('fs'),
    dust   = require('dustjs-linkedin'),
    sass   = require('node-sass'),
    watch  = require('watch'),
    colors = require('colors');

let Args    = require('./lib/args'),
    Helper  = require('./lib/helper'),
    Config  = require('./lib/config'),
    Options = require('./lib/options'),
    Logger  = require('./lib/logger');

/**
 * Michi
 *
 * @ToDo:
 *   - Add node-mailer
 *   - Add browser refresh
 *   - Add targeted builds
 */

let Michi = function (options) {

    let _options = Helper.isObject(options) ? options : {},
        _version = '0.0.1';

    /**
     * _init()
     */

    function _init() {
        Logger.banner(` Michi ${_version} `);

        if (Args.setup) {
            _setup();
        } else {
            _initDefaults();
        }
    }

    /**
     * _initDefaults()
     */

    function _initDefaults() {
        Options.set('debug',       Helper.isBoolean(_options.debug)      ? _options.debug       : false);
        Options.set('main_dir',    Helper.isString(_options.main_dir)    ? _options.main_dir    : path.join(process.cwd(), 'michi'));
        Options.set('build_dir',   Helper.isString(_options.build_dir)   ? _options.build_dir   : path.join(Options.get('main_dir'), 'build'));
        Options.set('src_dir',     Helper.isString(_options.src_dir)     ? _options.src_dir     : path.join(Options.get('main_dir'), 'src'));
        Options.set('config_file', Helper.isString(_options.config_file) ? _options.config_file : path.join(Options.get('main_dir'), 'michi.config.js'));

        Logger.debug('_initDefaults()');

        _loadMichiConfig().then(_start);
    }

    /**
     * _loadMichiConfig()
     *
     * @ToDo:
     *   - Warn user if projects array is empty
     */

    function _loadMichiConfig() {
        Logger.debug('_loadMichiConfig()');

        return new Promise((resolve, reject) => {
            Helper
                .loadModule(Options.get('config_file'))
                .then((config = {}) => {
                    config.projects = _filterConfigProjects(config.projects);

                    if (Helper.isEmpty(config.projects)) {
                        Logger.line(Options.get('config_file'), false, 'NO PROJECTS TO BUILD');
                        return reject();
                    }

                    Config.set('projects', config.projects);

                    resolve();
                })
                .catch((err) => {
                    Logger.error(err);

                    reject();
                });
        });
    }

    /**
     * _filterConfigProjects()
     */

    function _filterConfigProjects(projects) {
        Logger.debug('_filterConfigProjects()');

        let projects_is_array  = Helper.isArray(projects),
            projects_is_string = Helper.isString(projects);

        if (projects_is_array || projects_is_string) {
            projects = projects_is_string ? [projects] : projects;

            return projects.filter((project) => {
                return Helper.isString(project) && !Helper.isEmpty(project);
            });
        } else {
            return [];
        }
    }

    /**
     * _build()
     *
     */

    function _build() {
        Logger.debug('_build()');

        Helper
            .dirExists(Options.get('build_dir'))
            .then(() => {
                Logger.describe('Loading projects');

                Config.get('projects').forEach((project) => {
                    let project_path = path.join(Options.get('src_dir'), project);

                    Helper.dirExists(project_path)
                        .then(() => {
                            Logger.line(project, true, 'OK');

                            _initProjectBuild(project_path, project);
                        })
                        .catch(() => {
                            Logger.line(project, false, 'NOT FOUND');
                        });
                });
            })
            .catch(() => {
                Logger.line(Options.get('build_dir'), false, 'NOT FOUND');
            });
    }

    /**
     * _initProjectBuild()
     */

    function _initProjectBuild(project_path, project) {
        Logger.debug('_initProjectBuild()', project);

        let promises = [],
            errors = [];

        let context = {},
            templates,
            i18n;

        promises.push(
            _loadProjectConfig(project_path)
                .then((obj) => {
                    context.config = obj;
                })
                .catch((err) => {
                    errors.push(err);
                })
        );

        promises.push(
            _loadProjectTemplates(project_path)
                .then((obj) => {
                    templates = obj;
                })
                .catch((err) => {
                    errors.push(err);
                })
        );

        promises.push(
            _loadProjecti18n(project_path)
                .then((files) => {
                    i18n = files;
                })
                .catch((err) => {
                    errors.push(err);
                })
        );

        promises.push(
            _loadProjectStyles(project_path)
                .then((obj) => {
                    context.styles = obj;
                })
                .catch((err) => {
                    errors.push(err);
                })
        );

        Promise.all(promises).then(() => {
            if (errors.length) {
                Logger.describe(project);

                errors.forEach((err) => {
                    Logger.error(err);
                });
            } else {
                _buildProject(project, context, templates, i18n)
                    .then((logs) => {
                        Logger.describe(project);

                        logs.forEach((log) => {
                            log();
                        })
                    })
            }
        });
    }

    /**
     * _buildProject()
     *
     * - Clean it.
     */

    function _buildProject(project, context, templates, i18n) {
        Logger.debug('_buildProject()', project);

        return new Promise((resolve, reject) => {
            let project_build_path = path.join(Options.get('build_dir'), project),
                project_src_path = path.join(Options.get('src_dir'), project);

            Helper
                .rmDirR(project_build_path)
                .catch(() => {})
                .then(() => {

                    Helper
                        .ensureDir(project_build_path)
                        .then(() => {

                            _buildProjecti18ns(project, project_build_path, context, templates, i18n)
                                .then((logs) => {

                                    Helper
                                        .dirExists(path.join(project_src_path, 'img'))
                                        .then(() => {

                                            Helper
                                                .copyDir(path.join(project_src_path, 'img'), path.join(project_build_path, 'img'))
                                                .then(resolve(logs))
                                                .catch(resolve(logs));

                                        })
                                        .catch(resolve(logs));

                                })
                                .catch(reject);

                        });

                });

        });
    }

    /**
     * __buildProjecti18n()
     */

    function _buildProjecti18ns(project, project_build_path, context, templates, i18n) {
        return new Promise((resolve, reject) => {
            let promises = [],
                logs = [];

            for (let key in templates) {
                dust.loadSource(dust.compile(templates[key], key.replace(/\.dust/, '')));
            }

            for (let key in i18n) {
                context.i18n = i18n[key];

                dust.render('index', context, (err, html) => {
                    if (err) {
                        logs.push(() => {
                            Logger.error(err);
                        });

                        return;
                    }

                    let html_filename = `index_${key.replace(/\.js/i, '')}.html`;

                    promises.push(
                        Helper
                            .createFile(path.join(project_build_path, html_filename), html)
                            .then(() => {
                                logs.push(() => {
                                    Logger.line(html_filename, true, 'OK');
                                });
                            })
                    )
                });
            }

            Promise.all(promises).then(() => {
                resolve(logs);
            });
        });
    }

    /**
     * _loadProjectConfig()
     */

    function _loadProjectConfig(project_path) {
        Logger.debug('_loadProjectConfig()', project_path);

        return new Promise((resolve, reject) => {
            Helper
                .loadModule(path.join(project_path, 'config.js'))
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * _loadProjectTemplates()
     */

    function _loadProjectTemplates(project_path) {
        Logger.debug('_loadProjectTemplates()', project_path);

        return new Promise((resolve, reject) => {
            Helper
                .loadFiles(path.join(project_path, 'templates'), '.dust')
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * _loadProjecti18n()
     */

    function _loadProjecti18n(project_path) {
        Logger.debug('_loadProjecti18n()', project_path);

        return new Promise((resolve, reject) => {
            Helper
                .loadModules(path.join(project_path, 'i18n'))
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * _loadProjectStyles()
     */

    function _loadProjectStyles(project_path) {
        Logger.debug('_loadProjectStyles()', project_path);

        return new Promise((resolve, reject) => {
            let styles_path = path.join(project_path, 'styles');

            Helper
                .loadFiles(styles_path, '.scss')
                .then((files) => {
                    Helper
                        .compileCSS(styles_path, files)
                        .then((styles) => {
                            resolve(styles);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    /**
     * _watch()
     */

    function _watch() {
        watch.watchTree(Options.get('src_dir'), {
            ignoreDotFiles: true
        }, (f, curr, prev) => {
            if (typeof f == "object" && prev === null && curr === null) {
                // ...
            } else if (prev === null) {
                Logger.watch(f, 'ADDED');
            } else if (curr.nlink === 0) {
                Logger.watch(f, 'REMOVED');
            } else {
                Logger.watch(f, 'UPDATED');
            }

            _build();

            Logger.describe('Building');
        })
    }

    /**
     * _start()
     */

    function _start() {
        Logger.debug('_start()');

        if (Args.build) {
            _build();
        }

        else if (Args.watch) {
            _watch();
        }

        else if (Args.send) {
            _send();
        }
    }

    /**
     * _setup()
     */

    function _setup() {
        Logger.debug('_setup()');

        Logger.describe('Setting up workspace');

        Helper.createTree({
            'michi': {
                'michi.config.js': true,
                'build': {},
                'src': {
                    'untitled': {
                        'styles': {
                            'global.scss': false,
                            'head.scss': false
                        },
                        'templates': {
                            'index.dust': true
                        },
                        'i18n': {
                            'us.js': true
                        },
                        'img': {},
                        'config.js': true
                    }
                }
            }
        });
    }

    /**
     * _send()
     */

    function _send() {}

    /**
     * _configurePackages()
     */

    function _configurePackages() {
        dust.optimizers.format = (ctx, node) => {
            return node;
        };
    }

    _configurePackages();

    _init();

};

module.exports = new Michi();