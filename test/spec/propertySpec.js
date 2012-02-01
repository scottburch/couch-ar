describe('property tests', function() {

    var user;

    beforeEach(function() {
        ar = require('couch-ar');

        if(ar.TestUser === undefined) {
            ar.init({
                    dbName:'couch-ar-test',
                    root:__dirname + '/../testDomain'
                }
            );
            waitsFor(function() {
                return ar.TestUser;
            });
        }
    });

    describe('finders:false', function() {
        it('should not create a finder', function() {
            expect(ar.TestUser.findByFullName).toBe(undefined);
        });
    });


});