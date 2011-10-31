var domain = require('couch-ar');

domain.create('Broken',{
    dbName: 'couch-ar-test',
    properties:{
    }
}, function(that) {
    // forgot to return that
});


