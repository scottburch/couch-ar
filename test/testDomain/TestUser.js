var domain = require('couch-ar');

exports.TestUser = domain.create('TestUser',{
    properties:{
        username: {},
        password: {},
        firstName:{},
        lastName: {},
        fullName: {}
    },
    views: {
        firstAndLastName: {map: function() {
            emit(doc.firstName+doc.lastName, doc);
        }}
    }
}, function(that) {
    that.beforeSave = function() {
        that.fullName = that.firstName + ' ' + that.lastName;
    }
    return that;
});


