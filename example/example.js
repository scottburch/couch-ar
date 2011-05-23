var ar = require('../index');

 ar.init({
        dbName: 'couch-ar-example',            // The database name - couch-ar will create the database
        root: __dirname + '/domain'           // The root of the domain constructors
    }, function(db){
     setTimeout(createUser, 1000) // Some time for the database to initialize before starting
 });

function createUser() {

    var user = ar.User.create({
        username: 'scott',
        password: 'private',
        firstName:'Scott',
        lastName: 'Burch'
    });

    user.save(function(err,res){
        console.log('user ' + user.username + ' added')
        readUser();
    });
}

function readUser() {
    ar.User.findByFirstOrLastName('Scott', function(user) {
        console.log('users fullname is ' + user.fullName)              // Scott Burch
        removeAllUsers()
    });
}

function removeAllUsers() {
    ar.User.list(function(users){
        users.forEach(function(user) {
            user.remove(function(err,res){
                console.log('user ' + user.username + ' removed')
            });
        })
    })
}




