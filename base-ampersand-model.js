var AmpersandModel = require('ampersand-model');
var get = require('lodash/get');
var includes = require('lodash/includes');
var forOwn = require('lodash/forOwn');
var forEach = require('lodash/forEach');
var assign = require('lodash/assign');
var some = require('lodash/some');

AmpersandModel.extend({
    session: {
        useDefaultOptions: 'boolean',
        fetched: 'boolean',
        saved: 'boolean',
        destroyed: 'boolean'
    },
    constructor: function (opts) {
        this.initSyncHandlers(opts && opts.syncHandler);
        AmpersandModel.apply(this, arguments);
    },
    initSyncHandlers: function (options) {
        options = options || { initial: true };
        /*  
            These are set with initial: true, this forces a change event even if the value is already true. 
            The downside is you lose out on _previousAttributes and _changed.  
        */
        this.on('sync', function (opts) {
            if (get(opts, 'xhr.method') == "GET") {
                this.set('fetched', true, options);
            }
        }, this);

        this.on('destroy', function (opts) {
            this.set('destroyed', true, options);
        }, this);

        this.on('sync', function (opts) {
            if (includes(["POST", "PUT", "PATCH"], get(opts, 'xhr.method'))) {
                this.set('saved', true, options);
            }
        }, this);
    },
    sync: function (method, context, options) {
        if (options.useDefaultOptions) options = assign(this.getDefaultDefinitionExtrasForMethod(method), options);
        return sync.apply(this, arguments);
    },
    extend: function () {
        var child = AmpersandModel.extend.apply(this, arguments);
        var setupDefinitionExtra = function (def, name) {
            if (def.data) {
                child.prototype._definition[name].data = def.data;
            }
            if (def.option) {
                child.prototype._definition[name].option = def.option;
            }
        };

        for (var i = 0; i < arguments.length; i++) {
            var def = arguments[i];

            if (def.props) {
                forOwn(def.props, this.setupDefinitionExtra);
            }
            if (def.session) {
                forOwn(def.session, this.setupDefinitionExtra);
            }
        }
        return child;
    },
    getDefaultDefinitionExtrasForMethod: function (method) {
        var res = {};
        var val = undefined;
        var transformedMethod = '';

        forEach(Object.getPrototypeOf(this._definition), function (def, item) {
            if (def && (def.option || def.data)) {
                val = this._values[item];
                if (typeof val === 'undefined') val = result(def, 'default');
                if (this.getMatchingDefinitionExtra(def, 'option', method)) {
                    if (typeof val !== 'undefined') res[item] = val;
                }
                if (this.getMatchingDefinitionExtra(def, 'data', method)) {
                    if (typeof val !== 'undefined') {
                        if (!res.data) res.data = {};
                        res.data[item] = val;
                    }
                }
            }
        }, this);
        return res;
    },
    getMatchingDefinitionExtra: function (obj, prop, method) {
        return some(result(def, prop), function (item) { return item === method; });
    }
})