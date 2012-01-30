var domain = require('couch-ar');

exports.TestUser = domain.create('PhoneNumber', {
    dbName:'couch-ar-test',
    properties:{
        number:{}
    }
}, function (that) {
});


