var domain = require('couch-ar');

exports.TestUser = domain.create('Another',{
    dbName: 'couch-ar-test2',
    properties:{
        username: {},
        password: {},
        firstName:{},
        lastName: {},
        fullName: {}
    }
}, function(that) {
    that.beforeSave = function() {
        that.fullName = that.firstName + ' ' + that.lastName;
    }
    return that;
});


