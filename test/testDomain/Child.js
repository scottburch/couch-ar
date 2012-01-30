var domain = require('couch-ar');

exports.TestUser = domain.create('Child',{
    dbName: 'couch-ar-test',
    properties:{
        name: {}
    }
}, function(that) {
});


