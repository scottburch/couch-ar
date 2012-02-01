describe('couch-ar', function () {

    var domain = require('couch-ar');

// Testing initialization with and without the host and dbname
    runTests({createDbName:'couch-ar-test', domainDbName:'couch-ar-test', host:'localhost', port:5984, baseDir:'testDomain'});
    runTests({createDbName:'couch-ar-test2', baseDir:'testDomain2'});

    describe('duplicate namespaces for domains', function () {
        it('should have setup the duplicate namespace for the domains', function () {
            expect(domain['couch-ar-test'].TestUser).toBeDefined();
        });

        it('should make the domain constructor and the base constructor the same object', function () {
            expect(domain['couch-ar-test2'].TestUser).toBe(domain.TestUser);
        });
    });


    function runTests(testConfig) {
        describe('init() method with host and port options', function () {
            it('creates db', function () {
                domain = require('couch-ar');
                domain.init({
                        dbName:testConfig.createDbName,
                        root:__dirname + '/../' + testConfig.baseDir,
                        host:testConfig.host,
                        port:testConfig.port
                    },
                    function () {
                        // delay so that everything can be setup
                        setTimeout(asyncSpecDone, 100);
                    }
                );
                asyncSpecWait();
            });
        });

        describe('TestUser', function () {

            describe('save() method', function () {
                var dateCreated, lastUpdated;
                var user;
                var rev;
                it('should set id and rev before callback', function () {
                    user = domain.TestUser.create({username:'tester1', firstName:'Test', lastName:'Tester', erroneous:'xxxxxxxx', dbName:testConfig.domainDbName});
                    user.save(function (err, res) {
                        rev = user.rev;
                        expect(res.ok).toBeTruthy();
                        expect(user.id).toBeDefined();
                        expect(user.rev).toBeDefined();
                        expect(user.erroneous).toBeDefined();
                        expect(user.dateCreated).toBeDefined();
                        dateCreated = user.dateCreated;
                        expect(user.lastUpdated).toBeDefined();
                        lastUpdated = user.lastUpdated;
                        asyncSpecDone();
                    });
                    asyncSpecWait();
                });

                it('should allow us to create more than one', function () {
                    var u = domain.TestUser.create({username:'tester2', firstName:'Test2', lastName:'Tester2', dbName:testConfig.domainDbName});
                    u.save(function (err, res) {
                        expect(res.ok).toBeTruthy();
                        domain.TestUser.list(function (users) {
                            expect(users.length).toEqual(2);
                            asyncSpecDone();
                        });
                    });
                    asyncSpecWait();
                });


                it('should allow us to update the object after initial save', function () {
                    user.username = 'tester';
                    user.save(function (err, res) {
                        expect(res.ok).toBe(true);
                        expect(user.id).toBeDefined();
                        expect(user.rev).toBeDefined();
                        expect(rev).not.toEqual(user.rev);
                        expect(user.dateCreated.getTime()).toEqual(dateCreated.getTime());
                        expect(user.lastUpdated).not.toEqual(lastUpdated);
                        asyncSpecDone();
                    });
                    asyncSpecWait();
                })

                it('should call beforeSave method before writing to the db', function () {
                    expect(user.fullName).toEqual('Test Tester');
                });

                it('should not save properties not on propery list', function () {
                    domain.TestUser.findByUsername('tester', function (u) {
                        expect(u.erroneous).not.toBeDefined();
                        asyncSpecDone();
                    })
                    asyncSpecWait();
                });
            });

            describe('findByUsername() method', function () {
                it('should find user when using findByUsername', function () {
                    domain.TestUser.findByUsername('tester', function (user) {
                        expect(user.username).toEqual('tester');
                        expect(user.id).toBeDefined();
                        expect(user.rev).toBeDefined();
                        expect(user.dateCreated).toBeDefined();
                        expect(user.lastUpdated).toBeDefined();
                        asyncSpecDone();
                    });
                    asyncSpecWait();
                });

                it('should return undefined when using findByUsername with a unknown user', function () {
                    domain.TestUser.findByUsername('wrong', function (user) {
                        expect(user).not.toBeDefined();
                    });
                });
            });

            describe('findById() method', function () {
                it('should find a user using findById', function () {
                    domain.TestUser.findByUsername('tester', function (user) {
                        domain.TestUser.findById(user.id, function (user) {
                            expect(user.username).toEqual('tester');
                            expect(user.id).toBeDefined();
                            expect(user.rev).toBeDefined();
                            expect(user.dateCreated).toBeDefined();
                            expect(user.lastUpdated).toBeDefined();
                            asyncSpecDone();
                        });
                    });
                    asyncSpecWait();
                });
            });


            describe('list() method', function () {
                it('should show records in db', function () {
                    domain.TestUser.list(function (users) {
                        expect(users.length).toBeGreaterThan(0);
                        asyncSpecDone();
                    });
                });
                asyncSpecWait();
            });


            describe('findAllByDateCreated()', function () {
                it('should return docs', function () {
                    domain.TestUser.findAllByDateCreated(['a', 'Z'], function (users) {
                        expect(users.length).toEqual(2);
                        asyncSpecDone();
                    })
                    asyncSpecWait();
                })
            })


            describe('custom views', function () {
                it('should add the finder', function () {
                    expect(domain.TestUser.findByFirstOrLastName).toBeDefined();
                    expect(domain.TestUser.findAllByFirstOrLastName).toBeDefined();
                });

                it('findAll using custom view should return results', function () {
                    domain.TestUser.findAllByFirstOrLastName('Tester', function (users) {
                        expect(users.length).toBeGreaterThan(0);
                        asyncSpecDone();
                    })
                    asyncSpecWait();
                });

                it('find using custom view should return results', function () {
                    domain.TestUser.findByFirstOrLastName('Test', function (user) {
                        expect(user).toBeDefined();
                        expect(user.lastName).toEqual('Tester');
                        asyncSpecDone();
                    });
                    asyncSpecWait();

                });
            })


            describe('addView() method', function () {
                it('should add a view to the db and call the callback when done', function () {
                    domain.TestUser.addView('lastAndFirstName', {
                        map:function (doc) {
                            emit(doc.firstName + ':' + doc.lastName, doc);
                        }
                    }, function () {
                        asyncSpecDone();
                    });
                    asyncSpecWait();
                    runs(function () {
                        expect(domain.TestUser.findAllByLastAndFirstName).toBeDefined();
                        expect(domain.TestUser.findByLastAndFirstName).toBeDefined();
                    });
                });
                it('should provide a working findAllByLastAndFirstName()', function () {
                    var callback = jasmine.createSpy();
                    runs(function () {
                        domain.TestUser.findAllByLastAndFirstName('Test:Tester', callback);
                    });
                    waitsFor(function () {
                        return callback.callCount;
                    });
                    runs(function () {
                        var users = callback.mostRecentCall.args[0]
                        expect(users.length).toBe(1);
                        expect(users[0].firstName).toBe('Test');
                    });
                });

                it('should provide a working findByLastAndFirstName()', function () {
                    var callback = jasmine.createSpy();
                    runs(function () {
                        domain.TestUser.findByLastAndFirstName('Test:Tester', callback);
                    });
                    waitsFor(function () {
                        return callback.callCount;
                    });
                    runs(function () {
                        var user = callback.mostRecentCall.args[0];
                        expect(user.firstName).toBe('Test');
                    });
                });
            });


            describe('.viewNames', function () {
                it('should have viewNames', function () {
                    var viewNames = domain.TestUser.viewNames;
                    expect(viewNames).toContain('username');
                    expect(viewNames).toContain('id');
                    expect(viewNames).toContain('firstOrLastName');
                    expect(viewNames).toContain('lastAndFirstName');
                });
            });

            describe('remove() method', function () {
                it('should remove a record from couchDb', function () {
                    domain.TestUser.findAllByUsername(['tester', 'testerZ'], function (users) {
                        (function removeAll(u) {
                            u.remove(function (err, res) {
                                expect(res.ok).toBeTruthy();
                                users.length ? removeAll(users.shift()) : asyncSpecDone();
                            });
                        }(users.shift()))
                    });
                });
                asyncSpecWait();
            });


        });
    }

});