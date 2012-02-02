var checkLoaded = function() {};
var domainLoadedCount = 0;

var cradle = require('cradle');
var fs = require('fs');
var Base = require('./Base');
var helpers = require('./helpers');
var databases = {}
var defaultDbName;

/**
 * initialize the DB and create constructor factories
 * @param config
 * @param callback
 */

exports.init = function(config, callback) {
    var db;
    defaultDbName = config.dbName
    callback = callback || function() {
    };
    config.connectionOptions = config.connectionOptions || {};

    if (config.host && config.port) {
      db = new(cradle.Connection)(config.host, config.port, config.connectionOptions).database(config.dbName);
    } else {
      db = new cradle.Connection().database(config.dbName);
    }

    databases[config.dbName] = db;

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

        checkLoaded = function() {
            if(!domainLoadedCount) {
                callback(db);
            }
        }

        var filenames = fs.readdirSync(config.root);
        filenames.forEach(function(filename) {
            /\.js$/.test(filename) && require(config.root + '/' + filename)  && domainLoadedCount++;
        });

    }
}


/**
 * Create a domain constructor.  Use this in each domain file
 */
exports.create = function(name, config, constr) {
    config.dbName = config.dbName || defaultDbName;
    var db = databases[config.dbName];
    console.log('Adding to domain: ' + name);

    config.properties.dateCreated = {};
    config.properties.lastUpdated = {};

    var factory = function() {
        var c = Base(db, name, config);
        constr && constr.call(c,c);
        c.properties = config.properties;
        return c;
    }

    // Run all of the creators
    addCreateMethod();
    addViews(function() {
        addFinders();
        domainLoadedCount--;
        checkLoaded();
    });

    factory.addView = function() {
        addView.apply(factory, arguments);
    }
    factory.viewNames = [];

    exports[config.dbName] = exports[config.dbName] || {};
    return exports[name] = exports[config.dbName][name] = factory;

    function addFinders() {
        for (var prop in config.properties) {
            if(config.properties[prop].finders !== false) {
                addFinders(prop);
            }
        }
        for (view in config.views) {
            addFinders(view);
        }
        addFinders('id');
        addList();


        function addFinders(finderName) {
            var upperName = helpers.toUpper(finderName);

            factory['findAllBy' + upperName] = function(value, callback) {
                executeView(finderName, value, callback);
            }

            factory['findBy' + upperName] = function(value, callback) {
                factory['findAllBy' + upperName](value, function(results) {
                    callback(results[0]);
                });
            }
            factory.viewNames.push(finderName);
        }

        function addList() {
            factory.list = function(callback) {
                var url = ['_design/',name,'/_view/id'].join('');
                db.query('GET', url, function(err, res) {
                    callback(instantiateResults(res));
                })
            }
        }
    }

    function executeView(viewName, value, callback) {
        var options = {};
        if (Array.isArray(value)) {
            options.startKey = JSON.stringify(value[0]);
            options.endKey = JSON.stringify(value[1]);
        } else {
            options.key = JSON.stringify(value);
        }

        var url = ['_design/', name, '/_view/', viewName].join('');
        db.query('GET', url, options, function(err, res) {
            err && console.log(err);
            callback(err ? [] : instantiateResults(res));
        });
    }

    function instantiateResults(res) {
        return res.map(function(row) {
            row.id = row._id;
            row.rev = row._rev;
            return factory.create(row);
        })
    }


    function addView(viewName, viewDef, callback) {
        db.get('_design/' + name, function(err, res) {
            res.views[viewName] = wrapView(name, viewDef);
            saveView(res.views, callback);
        });
        function saveView(views, callback) {
            db.save('_design/' + name, views, function(err, res) {
                factory['findAllBy' + helpers.toUpper(viewName)] = function(value, callback) {
                    executeView(viewName, value, callback);
                }
                factory['findBy' + helpers.toUpper(viewName)] = function(value, callback) {
                    executeView(viewName, value, function(objects) {
                        callback(objects[0]);
                    });
                }
                callback();
            });
        }
        factory.viewNames.push(viewName);

    }

    function wrapView(type, view) {
        if (view.map) {
            view.map = view.map.toString();
            var code = "$1if (doc.type==='" + type + "'){$2}}"
            view.map = view.map.replace(/[\n]/g, '');
            view.map = view.map.replace(/(function.*?\(.*?\).*?{)(.*)}.*$/, code);
        }
        return view;
    }

    function addViews(callback) {
        var views = {};

        if (config.views) {
            Object.keys(config.views).forEach(function(viewName) {
                var view = config.views[viewName];
                wrapView(name, view);
                views[viewName] = view;
            });
        }


        for (prop in config.properties) {
            if(config.properties[prop].finders !== false) {
                views[prop] = {
                    map: "function(doc){if(doc.type === '" + name + "') {emit(doc." + prop + ", doc)}}"
                }
            }
        }
        views.id = {
            map: "function(doc){if(doc.type === '" + name + "') {emit(doc._id, doc)}}"
        }


        db.save('_design/' + name, views, function(err, res) {
            callback && callback();
        });

    }

    /**
     * Add the create() static method to the factory
     */
    function addCreateMethod() {
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
    }

}


