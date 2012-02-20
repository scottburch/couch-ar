var domain = require('couch-ar');

exports.TestUser = domain.create('PhoneNumber', {
    dbName:'couch-ar-test2',
    properties:{
        number:{}
    }
}, function (that) {
});


