var cradle = require('cradle');
var fs = require('fs');

var db;

/**
 * initialize the DB and create constructor factories
 * @param config
 * @param callback
 */
exports.init = function(config, callback) {
    callback = callback || function() {
    };
    config.connectionOptions = config.connectionOptions || {};

    if (config.host && config.port) {
      db = new(cradle.Connection)(config.host, config.port, config.connectionOptions).database(config.dbName);
    } else {
      db = new cradle.Connection().database(config.dbName);
    }

    db.exists(function(err, result) {
        if (result === false) {
            db.create(function() {
                initDomainConstructors();
            });
        } else {
            db.viewCleanup();
            db.compact();
            initDomainConstructors();
        }
    });

    function initDomainConstructors() {
        fs.readdirSync(config.root).forEach(function(filename) {
            /\.js$/.test(filename) && require(config.root + '/' + filename)
        });
        callback(db);
    }
}

/**
 * Create a domain constructor.  Use this in each domain file
 */
exports.create = function(name, config, constr) {
    console.log('Adding to domain: ' + name);

    config.properties.dateCreated = {};
    config.properties.lastUpdated = {};

    var factory = function() {
        var c = constr ? constr(Base()) : Base();
        c.properties = config.properties;
        return c;
    }

    // Run all of the creators
    addCreateMethod(function() {
        addViews(function() {
            addFinders(function() {
            });
        });
    });


    return exports[name] = factory;

    function addFinders(callback) {
        for (prop in config.properties) {
            addFindAllBy(prop);
            addFindBy(prop);
        }
        for (view in config.views) {
            addFindAllBy(view);
            addFindBy(view);
        }
        addFindAllBy('id');
        addFindBy('id');
        addList();
        callback();

        function instantiateResults(res) {
            return res.map(function(row) {
                row.id = row._id;
                row.rev = row._rev;
                return factory.create(row);
            })
        }

        function addFindAllBy(prop) {
            factory['findAllBy' + toUpper(prop)] = function(value, callback) {
                var options = {};
                if (Array.isArray(value)) {
                    options.startKey = JSON.stringify(value[0]);
                    options.endKey = JSON.stringify(value[1]);
                } else {
                    options.key = JSON.stringify(value);
                }
                var url = ['_design/', name, '/_view/', prop].join('');
                db.query('GET', url, options, function(err, res) {
                    err && console.log(err);
                    callback(err ? [] : instantiateResults(res));
                })
            }
        }

        function addFindBy(prop) {
            var upperName = toUpper(prop);
            factory['findBy' + upperName] = function(value, callback) {
                factory['findAllBy' + upperName](value, function(results) {
                    callback(results[0]);
                });
            }
        }

        function addList() {
            factory.list = function(callback) {
                var url = ['_design/',name,'/_view/id'].join('');
                db.query('GET', url, function(err, res) {
                    callback(instantiateResults(res));
                })
            }
        }


        function toUpper(s) {
            return s[0].toUpperCase() + s.slice(1);
        }
    }

    function addViews(callback) {
        var views = {};

        if (config.views) {
            Object.keys(config.views).forEach(function(viewName) {
                var view = config.views[viewName];
                if (view.map) {
                    view.map = view.map.toString();
                    var code = "$1if (doc.type==='" + name + "'){$2}}"
                    view.map = view.map.replace(/[\n]/g, '');
                    view.map = view.map.replace(/(function.*?\(.*?\).*?{)(.*)}.*$/, code);
                }
                views[viewName] = view;
            });
        }


        for (prop in config.properties) {
            views[prop] = {
                map: "function(doc){if(doc.type === '" + name + "') {emit(doc." + prop + ", doc)}}"
            }
        }
        views.id = {
            map: "function(doc){if(doc.type === '" + name + "') {emit(doc._id, doc)}}"
        }


        db.get('_design/' + name, function(err, res) {
            if (res) {
                db.remove('_design/' + name, function(err, res) {
                    if (res.ok) {
                        saveView();
                    }
                });
            } else {
                saveView();
            }
        });

        function saveView() {
            db.save('_design/' + name, views, function(err, res) {
                callback && callback();
            });
        }

    }

    /**
     * Add the create() static method to the factory
     */
    function addCreateMethod(callback) {
        factory.create = function(props) {
            var obj = factory();
            for (var n in props) {
                obj[n] = props[n];
            }
            // copy ids as well
            obj.id = obj.id || props._id || props.id
            obj.rev = obj.rev || props._rev || props.rev;
            return obj;
        }
        callback && callback();
    }

    /**
     * The base constructor that is extended by each domain constructor
     * Contains the basic methods save/remove...
     */
    function Base() {
        var that = {};

        that.serialize = function() {
            var obj = Object.getOwnPropertyNames(config.properties).reduce(function(obj, prop) {
                obj[prop] = that[prop];
                return obj;
            }, {});
            obj.type = name;
            obj._id = obj.id;
            obj._rev = obj.rev;
            return obj;
        }

        that.save = function(callback) {
            callback = callback || function() {
            }
            that.beforeSave && that.beforeSave();
            var out = that.serialize();
            that.dateCreated = that.dateCreated || new Date();
            that.lastUpdated = new Date();
            db.save(that.id, that.serialize(), function(err, res) {
                if (res.ok) {
                    that.id = res.id;
                    that.rev = res.rev
                }
                callback(err, res);
            });
        }

        that.remove = function(callback) {
            if (that.id) {
                db.remove(that.id, that.rev, function(err, res) {
                    that.id = err ? that.id : undefined;
                    callback(err, res);
                });
            } else {
                callback(err, res);
            }
        }
        return that;
    }
}


