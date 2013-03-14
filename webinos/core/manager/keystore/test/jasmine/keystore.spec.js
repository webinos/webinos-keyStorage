var ks = require('keystore');

describe("Manager.Keystore", function() {
    var secretKey = "mySecret";
    var secret = "987654321";
    it('add and return a simple secret', function() {
        ks.put(secretKey,secret);
        var secOut = ks.get(secretKey);
        expect(secOut).toEqual(secret);
    });

    it('delete the simple secret', function() {
        expect(function() {ks.delete(secretKey);});
    });

    it('delete a non-existing secret', function() {
        var wrongSecretKey = "noSecret";
        expect(function(){ks.delete(wrongSecretKey);}).toThrow();
    });
});
