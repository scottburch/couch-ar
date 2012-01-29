var domain = require('couch-ar');

domain.create('TestUser',{
    dbName: 'couch-ar-test',
    properties:{
        username: {},
        password: {},
        firstName:{},
        lastName: {},
        fullName: {}
    },
    hasMany: {
        phoneNumbers: 'PhoneNumber'
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
});


