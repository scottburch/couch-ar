var domain = require('couch-ar');

exports.TestUser = domain.create('Child',{
    dbName: 'couch-ar-test2',
    properties:{
        name: {}
    }
}, function(that) {
});


