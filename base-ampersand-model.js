var AmpersandModel = require('ampersand-model');
var get = require('lodash/get');
var includes = require('lodash/includes');

AmpersandModel.extend({
    session: {
        fetched: 'boolean',
        saved: 'boolean',
        destroyed: 'boolean'
    },
    constructor: function () {
        this.on('sync', function (opts) {
            if (get(opts, 'xhr.method') == "GET") {
                this.fetched = true;
            }
        }, this);

        this.on('destroy', function (opts) {
            this.destroyed = true;
        }, this);

        this.on('sync', function (opts) {
            if (get(opts, 'xhr.method') == "GET") {
                this.saved = true;
            }
        }, this);

    }
})