describe('property tests', function() {

    var user;
    var ar = require('couch-ar');

    describe('finders:false', function() {
        it('should not create a finder', function() {
            expect(ar.TestUser.findByFullName).toBe(undefined);
        });
    });


});
