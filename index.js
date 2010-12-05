var cradle = require('cradle');
var fs = require('fs');

var db;

exports.init = function(config, callback) {
    callback = callback || function() {};
    db = new cradle.Connection().database(config.dbName);

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
            if(/\.js$/.test(filename)) {
                var name = filename.substr(0, filename.lastIndexOf('.'));
                exports[name] = require(config.root + '/' + filename)[name];
            }
        })
        callback();
    }
}

exports.create = function(name, config, constructor) {


    var factory = function() {
        var c = constructor(Base());
        c.properties = config.properties;
        return c;
    }

    addViews();
    addFinders();
    addCreateMethod();

    return factory;


    function addFinders() {
        for (prop in config.properties) {
            addFindAllBy(prop);
            addFindBy(prop);
        }

        function addFindAllBy(prop) {
            factory['findAllBy' + toUpper(prop)] = function(value, callback) {
                var url = ['_design/', name, '/_view/', prop].join('');
                db.query('GET', url, {key:JSON.stringify(value)}, function(err, res) {
                    callback(res.map(function(row) {
                        row.id = row._id;
                        row.rev = row._rev;
                        return factory.create(row);
                    }));
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


        function toUpper(s) {
            return s[0].toUpperCase() + s.slice(1);
        }
    }


    function addViews() {
        var views = {};
        for (prop in config.properties) {
            views[prop] = {
                map: "function(doc){if(doc.type === '" + name + "') {emit(doc." + prop + ", doc)}}"
            }
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
            db.save('_design/' + name, views);
        }

    }

    function addCreateMethod() {
        factory.create = function(props) {
            var obj = factory();
            for (var n in config.properties) {
                obj[n] = props[n];
            }
            // copy ids as well
            obj.id = obj.id || props._id || props.id
            obj.rev = obj.rev || props._rev || props.rev;
            return obj;
        }
    }

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
            that.beforeSave && that.beforeSave();
            db.save(that.id, that.serialize(), function(err, res) {
                if(res.ok) {
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


