# couch-ar is a thin active record implementation for couchDB

## Motivation

 The idea behind couch-ar is to provide an easy to use active record
 implementation while  keeping the speed of node.js.  For this reason
 couch-ar does not add a lot of abstraction.  My aim is to provide an
 easy way to have full domain constructors while writing only the
 required information to the db document.

 Domain constructors are defined in advance with couch-ar
 in a simple format that includes a list of properties to write to the DB.

 Please feel free to write with any comments or suggestions: scott@bulldoginfo.com


## How to use

The best way to see how it works is to run the included tests.
    cd to test
    ./specs.sh

The tests are written using jasmine-node.
For information on how to run the tests using this module, please refer
to the jasmin-node documentation.  I have included only enough to run the
tests.

The first step is to run the init method to generate the database and read
your domain files.  After running init() the domain constructors are available
in the domain object (ex: domain.TestUser)

        var domain = require('couch-ar');
        domain.init({
            dbName: 'couch-ar-test',
            root: __dirname + '../testDomain'
        }, someCallback);

Next, create your domain files like this:

        require('couch-ar');

        exports.TestUser = domain.create('TestUser',{
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

Notice that I am using Douglas Crockford's parasitic inheritance and power constructors.
To understand my code it is best to understand this style.


## Before Hooks

domain constructors can include a hook beforeSave() that will be run before a document
is saved or updated in the DB.


## create()

couch-ar adds a static factory for constructing domain objects using a parameter map.
Simply call Domain.create({}) passing a map of parameters to add to the object.  Only
parameters defined during initialization will be included in the object.

example:
    domain.TestUser.create({username:'me', erroneous:true})

In the above example, username will be added but erroneous will not.  This is to make it
easy to add objects in controllers that return a params map without adding garbage to your object.


## save()

Saves or updates an existing document.

     user.save(function(err, res){  })


## remove()

Removes a document from the DB:

    user.remove(function(err, res) {});


## findByXxx() / findAllByXxx()

Every property gets a findBy or findAllBy method.  The usage is pretty simple:

    domain.TestUser.findAllByUsername('scott', function(user){ // called with the user object })



## License

Provided under the MIT license.  In other words, do what you want with it.


## Future Enhancements (coming soon)

* validation on save

