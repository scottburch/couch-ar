
var TestUser
var domain;

describe('init() method', function() {
    it('creates db', function() {
        domain = require('couch-ar')
        domain.init({
            dbName: 'couch-ar-test',
            root: __dirname + '/../testDomain'
        }, function() {
            // delay so that everything can be setup
            setTimeout(asyncSpecDone, 500);
        });
        asyncSpecWait();
    });




});


describe('TestUser', function() {


    describe('save() method', function() {
        var user;
        var rev;
        it('should set id and rev before callback', function() {
            user = domain.TestUser.create({username:'tester1', firstName:'Test', lastName:'Tester'});
            user.save(function(err, res) {
                rev = user.rev;
                expect(res.ok).toBeTruthy();
                expect(user.id).toBeDefined();
                expect(user.rev).toBeDefined();
                asyncSpecDone();
            });
            asyncSpecWait();
        });

        it('should allow us to update the object after initial save', function() {
            user.username = 'tester';
            user.save(function(err, res) {
                expect(res.ok).toBeTruthy();
                expect(user.id).toBeDefined();
                expect(user.rev).toBeDefined();
                expect(rev).not.toEqual(user.rev);
                asyncSpecDone();
            });
            asyncSpecWait();

        })

        it('should call beforeSave method before writing to the db', function() {
            expect(user.fullName).toEqual('Test Tester');
        })
    })

    describe('findByUsername() method', function() {
        it('should find user when using findByUsername', function() {
            domain.TestUser.findByUsername('tester', function(user) {
                expect(user.username).toEqual('tester');
                expect(user.id).toBeDefined();
                expect(user.rev).toBeDefined();
                asyncSpecDone();
            });
            asyncSpecWait();
        });
    });

    describe('remove() method', function() {
        it('should remove a record from couchDb', function() {
            domain.TestUser.findAllByUsername('tester', function(users) {
                (function removeAll(user) {
                    user.remove(function(err, res) {
                        expect(res.ok).toBeTruthy();
                        users.length ? removeAll(users.shift()) : asyncSpecDone();
                    });
                }(users.shift()))
            });
        });
        asyncSpecWait();
    });

})