/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2012 - 2013 Samsung Electronics (UK) Ltd
 * AUTHOR: Habib Virji (habib.virji@samsung.com)
 ********************************************************************************/
var ks = require('keystore');

// These functions are related to checking native code functionality
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