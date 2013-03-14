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
 * Copyright 2011 Habib Virji, Samsung Electronics (UK) Ltd
 *******************************************************************************/
var KeyStore = function () {
    "use strict";
    var os = require('os');
    var fs = require('fs');
    var path = require('path');
    var self = this;

    function checkPlatform() {
        if (self.metaData.webinosType ==="Pzp" && (os.type().toLowerCase() ==="linux" &&
            os.platform().toLowerCase() !== "android") || os.type().toLowerCase() === "darwin") {
            try {
                var  keystore = require("keystore");
                return keystore;
            } catch (err) {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    function writeFile(id, value, callback) {
        fs.writeFile(path.resolve(path.join(self.metaData.webinosRoot, "keys", id)), value, function(err) {
            if(err) {
                callback(false, {"Component": "KeyStore","Type": "WRITE", "Error": err, "Message": "Failed storing key"});
            } else {
                callback(true, value);
            }
        });
    }

    function storeKey(id, value, callback) {
        try{
            var keystore = checkPlatform();
            if(keystore) {
                keystore.put(id, value);
                callback(true, value);
            } else {
                writeFile(id, value, callback);
            }
        } catch (err) { // An exception has occurred in key-store store in file instead
            writeFile(id, value, callback);
        }
    }

    function getKey(id, callback) {
        var keyPath = path.resolve(path.join(self.metaData.webinosRoot, "keys", id));
        fs.readFile(keyPath, function(err, data) {
            if(err) {
                callback(false, {"Component": "KeyStore", "Type": "READ","Error": err, "Message": "Failed fetching key"});
            } else {
                callback(true, data.toString());
            }
        });
    }

    this.generateKey = function(type, id, callback) {
        try {
            var certManager = require("certificate_manager");
        } catch (err) {
            callback(false, {"Component": "KeyStore", "Type": "MODULE_MISSING", "Error": err, "Message": "CertificateManager is missing"});
            return;
        }
        try {
            var key;
            if (type === "PzhPCA" ||  type === "PzhCA" || type === "PzpCA"){
                key = certManager.genRsaKey(2048);
            } else {
                key = certManager.genRsaKey(1024);
            }
            storeKey(id, key, callback);
        } catch(err) {
            callback(false ,{"Component": "KeyStore", TYPE:"FUNC_ERROR", "Error": err, "Message": "Private key generation error"});
        }
    };

    this.fetchKey = function (id, callback) {
        var key, keystore = checkPlatform();
        try {
            if(keystore) {
                key = keystore.get(id);
                if (key.search("-----BEGIN RSA PRIVATE KEY-----") !== -1) {
                    callback(true, key);
                } else {
                    getKey(id, callback);
                }
            } else {
                getKey(id, callback);
            }
        } catch (err) {
            getKey(id, callback);
        }
    };
};

module.exports = KeyStore;
