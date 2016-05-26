let path = require('path'),
    fs   = require('fs'),
    sass = require('node-sass');

let Templates = require('./templates'),
    Logger    = require('./logger');

module.exports = {

    /**
     * isDir()
     */

    isDir: function (filepath) {
        Logger.debug('isDir()', filepath);

        return new Promise((resolve, reject) => {
            fs.stat(filepath, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats.isDirectory());
                }
            });
        });
    },

    /**
     * rmDir()
     */

    rmDir: function (filepath) {
        Logger.debug('rmDir()', filepath);

        return new Promise((resolve, reject) => {
            fs.rmdir(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * rmFile()
     */

    rmFile: function (filepath) {
        Logger.debug('rmFile()', filepath);

        return new Promise((resolve, reject) => {
            fs.unlink(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * rmDirR()
     */

    rmDirR: function (filepath) {
        Logger.debug('rmDirR()', filepath);

        return new Promise((resolve, reject) => {
            let promises = [];

            fs.readdir(filepath, (err, files) => {
                if (err) {
                    return reject(err);
                }

                if (files && !files.length) {
                    return resolve(this.rmDir(filepath));
                }

                files.forEach((file, index) => {
                    let fp = path.join(filepath, file);

                    this.isDir(fp)
                        .then((is_dir) => {
                            if (is_dir) {
                                promises.push(this.rmDirR(fp));
                            } else {
                                promises.push(this.rmFile(fp));
                            }

                            if (index === files.length - 1) {
                                Promise
                                    .all(promises)
                                    .then(() => {
                                        this.rmDir(filepath)
                                            .then(resolve);
                                    });
                            }
                        });
                });
            });
        });
    },

    /**
     * copyFile()
     */

    copyFile: function (source, target) {
        Logger.debug('copyFile()', source, target);

        return new Promise((resolve, reject) => {
            var rs = fs.createReadStream(source),
                ws = fs.createWriteStream(target);
            
            ws.on('error', reject).on('finish', resolve);
            rs.on('error', reject).pipe(ws);
        });
    },

    /**
     * copyDir()
     */

    copyDir: function (source, target) {
        Logger.debug('copyDir()', source, target);

        return new Promise((resolve, reject) => {
            let promises = [];

            this.createDir(target)
                .then(() => {
                    fs.readdir(source, (err, files) => {
                        if (err) {
                            return reject(err);
                        }

                        if (files && !files.length) {
                            return resolve();
                        }

                        files.forEach((file, index) => {
                            let source_fp = path.join(source, file),
                                target_fp = path.join(target, file);

                            this.isDir(source_fp)
                                .then((is_dir) => {
                                    if (is_dir) {
                                        promises.push(this.copyDir(source_fp, target_fp));
                                    } else {
                                        promises.push(this.copyFile(source_fp, target_fp));
                                    }

                                    if (index === files.length - 1) {
                                        Promise
                                            .all(promises)
                                            .then(resolve);
                                    }
                                });
                        });
                    });

                })
                .catch(reject);
        })
    },

    /**
     * dirExists()
     */

    dirExists: function (filepath) {
        Logger.debug('dirExists()', filepath);

        return new Promise((resolve, reject) => {
            fs.stat(filepath, (err, stats) => {
                if (err) {
                    reject(err);
                } else if (stats.isDirectory()) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    },

    /**
     * ensureDir()
     */

    ensureDir: function (filepath) {
        return new Promise((resolve, reject) => {
            this.dirExists(filepath)
                .then(resolve)
                .catch(() => {
                    this.createDir(filepath)
                        .then(resolve)
                        .catch(reject);
                });
        });
    },

    /**
     * createDir()
     */

    createDir: function (filepath) {
        Logger.debug('createDir()', filepath);

        return new Promise((resolve, reject) => {
            fs.mkdir(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * removeDir()
     */

    removeDir: function (filepath) {
        Logger.debug('removeDir()', filepath);

        return new Promise((resolve, reject) => {
            fs.rmdir(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * createFile()
     */

    createFile: function (filepath, data) {
        Logger.debug('createFile()', filepath);

        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * removeFile()
     */

    removefile: function (filepath) {
        Logger.debug('removeFile()', filepath);

        return new Promise((resolve, reject) => {
            fs.unlink(filepath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * createTree()
     */

    createTree: function (tree, tree_parent) {
        Logger.debug('createTree()', tree, tree_parent);

        for (let key in tree) {
            let tree_path = path.join(tree_parent || process.cwd(), key);

            if (this.isObject(tree[key])) {
                this.createDir(tree_path)
                    .then(() => {
                        Logger.line(tree_path, true, 'OK');

                        this.createTree(tree[key], tree_path);
                    })
                    .catch(() => {
                        Logger.line(tree_path, false, 'EXISTS');
                    });
            } else {
                this.createFile(tree_path, tree[key] ? Templates[key] : '')
                    .then(() => {
                        Logger.line(tree_path, true, 'OK');
                    })
                    .catch(() => {
                        Logger.line(tree_path, false, 'EXISTS');
                    });
            }
        }
    },

    /**
     * fileExists()
     */

    fileExists: function (filepath) {
        Logger.debug('fileExists()', filepath);

        return new Promise((resolve, reject) => {
            fs.readFile(filepath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    },

    /**
     * loadModule()
     */

    loadModule: function (filepath, ...args) {
        Logger.debug('loadModule()', filepath, ...args);

        return new Promise((resolve, reject) => {
            this.fileExists(filepath)
                .then((data) => {
                    if (args.length) {
                        resolve(require(filepath)(...args));
                    } else {
                        resolve(require(filepath));
                    }
                    
                })
                .catch(reject);
        });
    },

    /**
     * loadModules()
     *
     * @ToDo:
     *   - Make recursive
     */

    loadModules: function (dir) {
        Logger.debug('loadModules()', dir);

        return new Promise((resolve, reject) => {
            let promises = [],
                files = {};

            fs.readdir(dir, 'utf8', (err, filenames) => {
                if (err || this.isEmpty(filenames)) {
                    return reject(err);
                }

                filenames.forEach((filename) => {
                    if (filename.indexOf('.js') <= 0)
                        return;

                    promises.push(
                        this.loadModule(path.join(dir, filename))
                            .then((data) => {
                                files[filename] = data;
                            })
                    );
                });

                Promise.all(promises).then(() => {
                    resolve(files);
                });
            });
        });
    },

    /**
     * loadFile()
     */

    loadFile: function (filepath) {
        Logger.debug('loadFile()', filepath);

        return new Promise((resolve, reject) => {
            this.fileExists(filepath)
                .then(resolve)
                .catch(reject);
        });
    },

    /**
     * loadFiles()
     *
     * @ToDo:
     *   - Make recursive
     */

    loadFiles: function (dir, extension) {
        Logger.debug('loadFiles()', dir, extension);

        return new Promise((resolve, reject) => {
            let promises = [],
                files = {};

            fs.readdir(dir, 'utf8', (err, filenames) => {
                if (err || this.isEmpty(filenames)) {
                    return reject(err);
                }

                filenames.forEach((filename) => {
                    if (filename.indexOf(extension) <= 0)
                        return;

                    promises.push(
                        this.loadFile(path.join(dir, filename))
                            .then((data) => {
                                files[filename] = data;
                            })
                    );
                });

                Promise.all(promises).then(() => {
                    resolve(files);
                });
            });
        });
    },

    /**
     * parseCSS()
     *
     * @ToDo:
     *   - Improve RegEx
     */

    parseCSS: function (css_string) {
        Logger.debug('parseCSS()', css_string);

        let output = {},
            match;

        match = css_string.replace(/"/g, '\'').replace(/\n|\r/g, '').match(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*[^}]*}/g);

        if (this.isArray(match)) {
            match.forEach((css_class) => {
                let [name, block] = css_class.split(/{/);

                name = name.replace(/^(\.*\s*\n*)|(\s*)$/g, '');
                block = block.replace(/^(\s*\n*)|(\s*}\s*)$/g, '');

                output[name] = block;
            });
        }

        return output;
    },

    /**
     * compileCSS()
     */

    compileCSS: function (styles_path, files) {
        Logger.debug('compileCSS()', styles_path, files);

        return new Promise((resolve, reject) => {
            let promises = [],
                output = {},
                error;

            for (let key in files) {
                promises.push(
                    this.sassCompiler(path.join(styles_path, key))
                        .then((result) => {
                            if (key === 'global.scss') {
                                output = Object.assign(output, this.parseCSS(result));
                            }

                            output[key.replace(/\.scss/, '_css')] = result;
                        })
                        .catch((err) => {
                            error = err;
                        })
                );
            }

            Promise.all(promises).then(() => {
                if (error) {
                    reject(error);
                } else {
                    resolve(output);
                }
            });
        });
    },

    /**
     * sassCompiler()
     */

    sassCompiler: function (style_path) {
        Logger.debug('sassCompiler()', style_path);

        return new Promise((resolve, reject) => {
            sass.render({
              file: style_path,
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.css.toString());
                }
            });            
        });
    },

    /**
     * sanitizeFilename()
     */

    sanitizeFilename: function (type, filepath) {
        Logger.debug('sanitizeFilename()', type, filepath);

        return filepath.replace(/\.[^.]+$/, '') + `.${type}`;
    },

    /**
     * Primitive Helpers
     */

    keys: function (obj) {
        if (this.isObject(obj)) {
            return Object.keys(obj);
        } else if (this.isArray(obj)) {
            return obj;
        } else {
            return [];
        }
    },

    isEmpty: function (value) {
        if (this.isString(value)) {
            return value.trim().length === 0;
        } else {
            return this.keys(value).length === 0;
        }
    },

    isObject: function (value) {
        return typeof value === 'object' && value instanceof Object;
    },

    isFunction: function (value) {
        return typeof value === 'function';
    },

    isString: function (value) {
        return typeof value === 'string' || value instanceof String;
    },

    isArray: function (value) {
        return Array.isArray(value);
    },

    isNumber: function (value) {
        return !isNaN(value);
    },

    isBoolean: function (value) {
        return value === true || value === false;
    },

    isUndefined: function (value) {
        return value === undefined;
    },

    isFalse: function (value) {
        return value === false;
    },

    isNull: function (value) {
        return value === null;
    },

    isFUN: function (value) {
        return this.isFalse(value) || this.isUndefined(value) || this.isNull(value);
    }

};