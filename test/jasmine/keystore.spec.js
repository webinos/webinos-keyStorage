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
var secretKey = "mySecret";
var secret = "987654321";
// These functions are related to checking native code functionality
describe("Manager.Keystore", function() {
    if (require("os").platform() === "linux") {
        try {
            var config = require("../../config.json");
            if (config.params.storageType ==="keyStorage"){
            var ks = require('keystore');
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
        } catch(err) {
            console.log("keystore is not loaded");
        }
    }
});

// KeyStore JavaScript calls
describe("KeyStore JS tests", function() {
    var KeyStore= require("../../lib/keystore.js");
    var WebinosPath = require("webinos-utilities").webinosPath;
    KeyStoreInstance = new KeyStore("Pzp", WebinosPath.webinosPath());
    var checkKey;
    var RSA_START       = "-----BEGIN RSA PRIVATE KEY-----";
    var RSA_END         = "-----END RSA PRIVATE KEY-----";
    if(!require("fs").existsSync(WebinosPath.webinosPath())) {
      require("fs").mkdirSync(WebinosPath.webinosPath());
      require("fs").mkdirSync(WebinosPath.webinosPath()+"/keys");
    }
    it("generate and store key", function() {
        KeyStoreInstance.storeKey(secretKey, secret, function(status, key){
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
    KeyStoreInstance.on("READ", function(errText, err) {
        expect(errText).not.toBeNull();
        expect(typeof err).toEqual("object");
        expect(err.code).toEqual("EISDIR");
        expect(err.errno).toEqual(28);
        expect(errText).toEqual("Failed Fetching Key");
    });
    KeyStoreInstance.on("WRITE", function(errText, err) {
        expect(errText).not.toBeNull();
        expect(typeof err).toEqual("object");
        expect(err.code).toEqual("EISDIR");
        expect(err.errno).toEqual(28);
        expect(errText).toEqual("Failed Storing Key");
    });
    KeyStoreInstance.on("CLEANUP", function(errText, err) {
        expect(errText).not.toBeNull();
        expect(typeof err).toEqual("object");
        expect(err.code).toEqual("EISDIR");
        expect(err.errno).toEqual(28);
        expect(errText).toEqual("Failed Deleting Key");
    });
    KeyStoreInstance.on("FUNC_ERROR", function(errText, err) {
        expect(errText).not.toBeNull();
        expect(typeof err).toEqual("object");
    });

    it("check exception while storing generated key", function() {
        KeyStoreInstance.storeKey(null, secret, function(){
        });
    });
    it("check exception while fetching key with empty secretKey", function() {
        KeyStoreInstance.fetchKey("", function(){

        });
    });
    it("check exception while deleting key", function() {
        KeyStoreInstance.deleteKey(undefined, function(){
        });
    });
});
