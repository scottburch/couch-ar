describe('hasMany', function() {
    var domain = require('couch-ar');

    var user, phoneNumber1, phoneNumber2, phoneNumber3, child1, child2, child3;

    beforeEach(function() {
            user = domain.TestUser.create({});
            phoneNumber1 = domain.PhoneNumber.create({id:'pn1'});
            phoneNumber2 = domain.PhoneNumber.create({id:'pn2'});
            phoneNumber3 = domain.PhoneNumber.create({});
            child1 = domain.Child.create({id:'child1'});
            child2 = domain.Child.create({id:'child2'});
            child3 = domain.Child.create({id:'child3'});
    });

    it('should create "Ids" array', function() {
        expect(user.phoneNumberIds).toEqual([]);
        expect(user.childIds).toEqual([]);
    });

    describe('hasMany adder', function(){
        it('should add the id of the new entity to the list of ids', function() {
            user.addPhoneNumber(phoneNumber1);
            expect(user.phoneNumberIds).toEqual(['pn1']);

            user.addChild(child1);
            expect(user.childIds).toEqual(['child1']);
        });

        it('will not add the same one twice', function() {
            user.addPhoneNumber(phoneNumber1);
            user.addPhoneNumber(phoneNumber2);
            user.addPhoneNumber(phoneNumber1);
            expect(user.phoneNumberIds).toEqual(['pn1','pn2']);

            user.addChild(child1);
            user.addChild(child2);
            user.addChild(child1);
            expect(user.childIds).toEqual(['child1','child2']);
        });

        it('will throw exception if you are adding something that is not persisted', function() {
            expect(function() {user.addPhoneNumber(phoneNumber3)}).toThrow('Can not add non-persisted entity to hasMany');

        });
    });

    describe('hasMany getter', function() {
        beforeEach(function() {
            var cb = jasmine.createSpy();
            phoneNumber1.save(cb);
            phoneNumber2.save(cb);
            child1.save(cb);
            child2.save(cb);
            waitsFor(function() {
                return cb.callCount === 4;
            });
        });

        it('will get entities that are added', function() {
            var callback;
            runs(function() {
                user.addPhoneNumber(phoneNumber1);
                user.addPhoneNumber(phoneNumber2);
                callback = jasmine.createSpy();
                user.getPhoneNumbers(callback);
            });
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                var phoneNumbers = callback.argsForCall[0][0];
                expect(phoneNumbers[0].id).toMatch(/pn[12]/);
                expect(phoneNumbers[1].id).toMatch(/pn[12]/);
            });

            runs(function() {
                user.addChild(child1);
                user.addChild(child2);
                callback = jasmine.createSpy();
                user.getChildren(callback);
            });
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                var children = callback.argsForCall[0][0]
                expect(children[0].id).toMatch(/child[12]/);
                expect(children[1].id).toMatch(/child[12]/);
            });
        });

        it('will return an empty array if there are no entities', function() {
            var callback;
            runs(function() {
                callback = jasmine.createSpy();
                user.getPhoneNumbers(callback);
            });
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                expect(callback).toHaveBeenCalledWith([]);
            });

            runs(function() {
                callback = jasmine.createSpy();
                user.getChildren(callback);
            });
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                expect(callback).toHaveBeenCalledWith([]);
            });
        });
    });

    describe('hasMany remover', function() {
        beforeEach(function() {
            user.addPhoneNumber(phoneNumber1);
            user.addPhoneNumber(phoneNumber2);
            user.addChild(child1);
            user.addChild(child2);
        });

        it('removes the phone number from the list', function() {
            user.removePhoneNumber(phoneNumber2);
            expect(user.phoneNumberIds).toEqual(['pn1']);
        });

        it('removes the child from the list', function() {
            user.removeChild(child1);
            expect(user.childIds).toEqual(['child2']);
        });

        it('does not error if an unknown one is removed', function() {
            expect(function() {
                user.removePhoneNumber(phoneNumber2);
                user.removePhoneNumber(phoneNumber2);
            }).not.toThrow();
        });
    });

});
