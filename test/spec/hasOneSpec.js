var ar = require('couch-ar');

describe('hasMany', function() {

    var user, phoneNumber;

    beforeEach(function() {
        ar = require('couch-ar');

        if(ar.TestUser === undefined) {
            ar.init({
                    dbName:'couch-ar-test',
                    root:__dirname + '/../' + 'testDomain'
                }
            );
            waitsFor(function() {
                return ar.TestUser;
            });
        }

        runs(function() {
            user = ar.TestUser.create({});
            phoneNumber = ar.PhoneNumber.create({id:'pn1'});
        });
    });

    describe('hasOne setter', function() {
        it('should set the id of the new entity to the id property', function() {
            user.setHomePhoneNumber(phoneNumber);
            expect(user.homePhoneNumberId).toBe('pn1');
        });

        it('will throw exception if you are setting something that is not persisted', function() {
            phoneNumber.id = undefined;
            expect(function() {user.setHomePhoneNumber(phoneNumber)}).toThrow('Can not set non-persisted entity to hasOne');
        });

        it('allows you to set undefined', function() {
            user.setHomePhoneNumber(undefined);
            var callback = jasmine.createSpy();
            user.getHomePhoneNumber(callback);
            expect(callback).toHaveBeenCalledWith(undefined);

        });
    });

    describe('hasOne getter', function() {

        beforeEach(function() {
            var cb = jasmine.createSpy();
            phoneNumber.save(cb);
            waitsFor(function() {
                return cb.callCount;
            });
        });

        it('will get entity that is set', function() {
            var callback = jasmine.createSpy();
            runs(function() {
                user.setHomePhoneNumber(phoneNumber);
                user.getHomePhoneNumber(callback);
            });
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                var phoneNumber = callback.argsForCall[0][0];
                expect(phoneNumber.id).toBe('pn1');
            });
        });

        it('returns undefined if entity is not set', function() {
            var callback = jasmine.createSpy();
            expect(user.getHomePhoneNumber(callback));
            waitsFor(function() {
                return callback.callCount;
            });
            runs(function() {
                expect(callback).toHaveBeenCalledWith(undefined);
            });
        });
    });
});