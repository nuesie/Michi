module.exports = {

    map: {},

    set: function (key, value) {
        this.map[key] = value;
    },

    get: function (key) {
        return this.map[key];
    }

};