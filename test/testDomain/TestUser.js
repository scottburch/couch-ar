var domain = require('couch-ar');

domain.create('TestUser',{
    dbName: 'couch-ar-test',
    properties:{
        username: {},
        password: {},
        firstName:{},
        lastName: {},
        fullName: {finders:false}
    },
    hasMany: {
        phoneNumbers: 'PhoneNumber',
        children: {type: 'Child', singular: 'child'}
    },
    hasOne: {
        homePhoneNumber: 'PhoneNumber'
    },
    views: {
        firstOrLastName: {map: function(doc) {
            emit(doc.firstName, doc);
            emit(doc.lastName, doc);
        }}
    }
}, function(that) {
    this.beforeSave = function() {
        that.fullName = that.firstName + ' ' + that.lastName;
    }
    that.afterSave = function(res, callback) {
        setTimeout(function() {
            that.afterSaveRun = true;
            callback(undefined, res);
        },200);
    };

});


