/**
 * The base constructor that is extended by each domain constructor
 * Contains the basic methods save/remove...
 */
"use strict";
module.exports = function(db, name, config) {
    var domain = require('couch-ar');
    var helpers = require('./helpers');
    var that = {};

    configureHasMany();


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
            callback();
        }
    }
    return that;

    function configureHasMany() {

        Object.keys(config.hasMany || {}).forEach(function(propName){
            var singularPropName = propName.replace(/(.*)s$/,'$1');
            var upperPropName = helpers.toUpper(propName);
            var singularUpperPropName = helpers.toUpper(singularPropName);
            var idsArray = that[singularPropName + 'Ids'] = [];
            var model = domain[config.hasMany[propName]];
            addGetter();
            addAdder();
            addRemover();

            function addGetter() {
                that['get' + upperPropName] = function(cb) {
                    var count = 0;
                    var things = [];
                    var ids = idsArray.slice(0);
                    ids.length === 0 && cb([]);
                    ids.forEach(function(id) {
                        model.findById(id, function(thing) {
                            things.push(thing);
                            count++;
                            count === ids.length && cb(things);
                        });
                    });
                }
            }

            function addAdder() {
                that['add' + singularUpperPropName] = function(it) {
                    if(it.id === undefined) {
                        throw 'Can not add non-persisted entity to hasMany';
                    }
                    idsArray.indexOf(it.id) === -1 && idsArray.push(it.id);
                }
            }

            function addRemover() {
                that['remove' + singularUpperPropName] = function(it) {
                    var idx = idsArray.indexOf(it.id);
                    if(idx !== -1) {
                        idsArray.splice(idx,1);
                    }
                }
            }
        });
    }
}
