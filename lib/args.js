let args  = process.argv;

module.exports = (() => {

    let flags = {};

    args
        .filter((arg) => {
            return /^--+/.test(arg);
        })
        .map((arg) => {
            return arg.replace(/^--+/, '');
        })
        .forEach((arg) => {
            if (arg.indexOf('=') < 0) {
                flags[arg.toLowerCase()] = true;
                return;
            }

            let [key, value] = arg.split('=');

            flags[key.toLowerCase()] =
                (/^(true|false)$/i.test(value)) ? /true/i.test(value) :
                (!isNaN(value)) ? +value : value;
        });

    return flags;

})();