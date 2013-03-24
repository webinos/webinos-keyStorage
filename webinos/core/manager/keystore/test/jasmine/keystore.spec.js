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
// These functions are related to checking native code functionality
describe("Manager.Keystore", function() {
    if (require("os").platform() === "linux") {
        var ks = require('keystore');   
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
    }
});

// KeyStore JavaScript calls
describe("KeyStore JS tests", function() {
    var KeyStore= require("../../lib/keystore.js");
    var WebinosPath = require("../../../../util/lib/webinosPath");
    KeyStoreInstance = new KeyStore("Pzp", WebinosPath.webinosPath());
    console.log(WebinosPath.webinosPath());
    var secretKey = "webinosPzp";
    var checkKey;
    it("generate and store key", function() {
        KeyStoreInstance.generateStoreKey("Pzp", secretKey, function(status, key){
            checkKey = key;
            expect(status).toBeTruthy();
            expect(key).not.toBeNull();
            expect(key).not.toEqual("");
            expect(key).toContain(RSA_START);
            expect(key).toContain(RSA_END);
        });
    });
    it("fetch a secret key", function() {
        KeyStoreInstance.fetchKey(secretKey, function(status, key){
            expect(status).toBeTruthy();
            expect(key).not.toBeNull();
            expect(key).not.toEqual("");
            expect(key).toContain(RSA_START);
            expect(key).toContain(RSA_END);
            expect(key).toEqual(checkKey);
        });
    });
    it("delete key", function() {
        KeyStoreInstance.deleteKey(secretKey, function(status, errmsg){
            expect(status).toBeTruthy();
        });
    });
});

// Check exceptions
describe("KeyStore Exception JS tests", function() {
    process.on("READ", function(errText, err) {
        console.log(errText);
        console.log(err);
        expect(errText).not.toBeNull();
        expect(typeof err).toEqual("object");
        expect(err.Code).toEqual("ENOENT");
        expect(err.errno).toEqual(34);        
    });
    it("check exception while storing generated key", function() {
        KeyStoreInstance.generateStoreKey("Pzp", null, function(statusG, errMsg){           
        });
    });
    it("check exception while fetching key with empty secretKey", function() {
        KeyStoreInstance.fetchKey("", function(statusF, errMsg){
            expect(statusF).toBeFalsy();
            expect(errMsg).not.toBeNull();
            expect(typeof errMsg).toEqual("object");
            expect(errMsg.Component).toEqual("KeyStore");
            expect(errMsg.Type).toEqual("READ");
            expect(errMsg.Message).toEqual("Failed fetching key");
        });
    });
    it("check exception while deleting key", function() {
        KeyStoreInstance.deleteKey(undefined, function(statusD, errMsg){
            expect(statusD).toBeFalsy();
            expect(errMsg).not.toBeNull();
            expect(typeof errMsg).toEqual("object");
            expect(errMsg.Component).toEqual("KeyStore");
            expect(errMsg.Type).toEqual("CLEANUP");
            expect(errMsg.Message).toEqual("Failed deleting key");
        });
    });
});