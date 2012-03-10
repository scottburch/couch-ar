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

## Installation

npm install cradle (this is a dependency)

npm install couch-ar

NOTE: We also use 'fs'

## Quickstart

There is a quick example in the example directory. This is also a good way to see if you have everything setup correctly.

    cd example
    node example

The example does not contain all of the functions.  Just basic save/read/remove.
It is recommended that you read the 'How to use' section to get more detail.

The most complete way to see how it works is to examine and run the included tests.
    cd to test
    ./specs.sh

The tests are written using jasmine-node.
For information on how to run the tests using this module, please refer
to the jasmin-node documentation.  I have included only enough to run the
tests.

## How to use

The first step is to run the init method to generate the database and read
your domain files.

        require('couch-ar').init({
            dbName: 'couch-ar-test',                    // The database name - couch-ar will create the database
            root: __dirname + '../testDomain'           // The root of the domain constructors
            host: 'myHost'                              // (optional) The hostname
            port: 9999                                  // (optional) The port
            connectionOptions: {}                       // (optional) Cradle config options
        }, function(db){ // passes back the cradle connection });

Next, create your domain files in ../testDomain like this:

    var domain = require('couch-ar');
    domain.create('TestUser',{
        dbName: 'couch-ar-test',                          // Optional - choose the db to use for this domain constructor
        properties:{
            username: {},
            password: {},
            firstName:{},
            lastName: {},
            fullName: {finders:false}                   // Turns off the creation of finders (findByXXX) for this property
        },
        hasMany: {
            phoneNumbers: 'PhoneNumber',
            children: {type: 'Child', singular: 'child'}
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
        },
        that.afterSave = function(res, callback) {
            // do something and callback with (err, res)
            callback(undefined, res);
        };

        return that;
    });


## Constructor

Domain definitions can contain a constructor function as an argument.  'this' in constructor functions points to the instantiated object itself so that you can
use the constructor function to modify the instantiated object or the provided 'that' argument.

I am using Douglas Crockford's parasitic inheritance and power constructors.
To understand my code it is best to understand this style.

After running init() the domain constructors are available from the couch-ar object.

    var domain = require('couch-ar');
    domain.TestUser.create({}) or domain['my-db-name'].TestUser.create({})


## Before Hooks

domain constructors can include a hook beforeSave() that will be run before a document
is saved or updated in the DB.

## After Hooks

domain constructors can include a hook afterSave(res, cb) that will run after a document is saved.  See the previous example for the format.


## create()

couch-ar adds a static factory for constructing domain objects using a parameter map.
Simply call Domain.create({}) passing a map of parameters to add to the object.  

example:
    domain.TestUser.create({username:'me'})


## save()

Saves or updates an existing document.

     user.save(function(err, res){  })


## remove()

Removes a document from the DB:

    user.remove(function(err, res) {});


## list()

List all documents

   domain.TestUser.list(function(users){});


## findByXxx() / findAllByXxx()

Every property that does not have a "finders:false" in it's config gets a findBy or findAllBy method.  The usage is pretty simple:

    domain.TestUser.findAllByUsername('scott', function(users){ // passed the user objects })
    domain.TestUser.findById('xxxxxx', function(user){})


findAllByXxx() can find documents in a range by passing an array as the value with the start and end keys

    domain.TestUser.findAllByUsername(['a','aZ'], function(users) { // passed the user objects where username starts with 'a'})


## addView()

You can also add views after a domain constructor is initialized by using the addView() method

    var view = {
           map: function(doc) {
                    emit(doc.firstName + ':' + doc.lastName, doc);
                }
            }

    function callbqack(){}

    domain.TestUser.addView('lastAndFirstName', view, callback);

After that the view is available as finders just like any other view

    domain.TestUser.findAllByFirstAndLastName('Scott:Burch', function(users) {})
    domain.TestUser.findByFirstAndLastName('Scott:Burch', function(user) {})


## properties

id = the DB id

rev = the DB revision

dateCreated = the date the object was first saved to the DB

lastUpdated = the date the object was last updated

## constructor properties

viewNames = the list of view names

## custom views

You can also add custom views to any domain constructor

The following example will create a view to find a user by first or last name:

    domain.create('TestUser',{
        dbName: 'my-db'
        properties:{
            username: {},
            password: {},
            firstName:{},
            lastName: {},
        },
        hasMany: {
           phoneNumbers: 'PhoneNumber',
           children: {type: 'Child', singular: 'child'}
        },
        views: {
            firstOrLastName: {map: function(doc) {
                emit(doc.firstName, doc);
                emit(doc.lastName, doc);
            }}
        }
    });

This code will also add static finders:

    domain.TestUser.findAllByFirstOrLastName('Test',function() {});
    domain.TestUser.findByFirstOrLastName('Tester',function() {});


## Associations

couch-ar now supports hasMany associations.  To define a hasMany association pass a __hasMany__ in the config as shown above.
The value 'PhoneNumber' and 'Child' is a previously defined model.

When you only supply a string then the singular names will be converted by chopping the 's' off the end.
The result is three new methods.

Assuming the hasMany definition above the result will be 6 methods:

* __addPhoneNumber(pn)__
* __getPhoneNumbers(callback)__
* __removePhoneNumber(pn)__
* __addChild(c)__
* __getChildren(callback)__
* __removeChild(c)__

the add and remove can take a phone number directly. However, getters requires a callback which will be passed the result.
The items passed to add and remove must be persisted before trying to add or remove them.




## License

Provided under the MIT license.  In other words, do what you want with it.

