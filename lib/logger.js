let colors = require('colors');

let Options = require('./options');

module.exports = (function () {

    let _tpl = {
        arrow: ` > `.bold,
    };

    function _print(...args) {
        console.log(...args);
    }

    function _divider() {
        return '—'.repeat(process.stdout.columns - 2);
    }

    function banner(msg) {
        _print(msg.bgBlack.bold.white);
    }

    function describe(msg) {
        // _print(_divider());
        _print('\n' + _tpl.arrow, msg.bold, '...');
    }

    function watch(file, status) {
        _print();
        _print(_divider());
        line(file, true, status);
        _print(_divider());
    }

    function line(msg, state, status) {
        status = status.toUpperCase().bold;

        _print(_tpl.arrow, msg, `...`.bold, (state) ? status.blue : status.red);
    }

    function error(...args) {
        _print(_tpl.arrow, `ERROR:`.bold.red, ...args);
    }

    function warning(...args) {
        _print(_tpl.arrow, `WARNING:`.bold.blue, ...args);
    }

    function debug(title, ...args) {
        if (Options.get('debug')) {
            _print(_divider());
            _print(_tpl.arrow, `DEBUG:`.bold.blue, title.bold, `...`.bold);

            [...args].forEach((arg, index) => {
                _print(_tpl.arrow, arg);
            });
        }
    }

    return {
        banner:   banner,
        describe: describe,
        watch:    watch,
        line:     line,
        error:    error,
        warning:  warning,
        debug:    debug
    };

})();