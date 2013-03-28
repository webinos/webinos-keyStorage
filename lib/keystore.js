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
var KeyStore = function (webinosType, webinosRoot) {
    "use strict";
    var os = require('os');
    var fs = require('fs');
    var path = require('path');
    var KeyStoreContext = this; // OwnInstance
    
    /**
     * KeyStore is supported only on Linux and Mac platform, this function does platform check and if keystore can be
     * loaded
     * On linux platform too if gnome-keyring is not present keyStore could fail to load
     * @return {Object} returns keystore object or undefined if could not be loaded
     */
    function checkPlatform() {
        if (webinosType ==="Pzp" && (os.type().toLowerCase() ==="linux" &&
            os.platform().toLowerCase() !== "android") || os.type().toLowerCase() === "darwin") {
            try {
                return require("keystore");
            } catch (err) {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    /**
     * Helper function used by storeKey to write into a file
     * @param {String} id - File id
     * @param {String} value - Key data in PEM format
     * @param {Function} callback -returns true if data is stored else false
     */
    function writeFile(id, value, callback) {
        fs.writeFile(path.resolve(path.join(webinosRoot, "keys", id)), value, function(err) {
            if(err) {
                KeyStoreContext.emit("WRITE", "Failed Storing Key", err);
            } else {
                callback(true, value);
            }
        });
    }

    /**
     * Helper function used by generateStoreKey to store keys in keystore or call writeFile to store in a file
     * @param {String} id - fileName or secretKey used for storing PEM key
     * @param {String} value - Key in PEM format
     * @param {Function} callback - return status true or false
     */
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

    /**
     * Helper function used by fetchKey to read private key from a file
     * @param {String} id - fileName to retrieve a private key
     * @param {Function} callback - true if private key was fetched successful else false
     */
    function getKey(id, callback) {
        var keyPath = path.resolve(path.join(webinosRoot, "keys", id));
        console.log(keyPath);
        fs.readFile(keyPath, function(err, data) {
            if(err) {
                KeyStoreContext.emit("READ", "Failed Fetching Key", err);
            } else {
                callback(true, data.toString());
            }
        });
    }

    /**
     * Helper function to delete private key from a file
     * @param {String} id - FileName of the private key
     * @param {Function} callback - true if file deleted else false
     */
    function deleteKeyFile(id, callback){
        try {
            var keyPath = path.resolve(path.join(webinosRoot, "keys", id));
            fs.unlinkSync(keyPath);
            callback(true);
        } catch(err){
            KeyStoreContext.emit("CLEANUP", "Failed Deleting Key", err);
        }
    }
    /**
     * Public function to generate private key and store key
     * @param {String} type - Webinos type, used for using different key size for client and server
     * @param {String} id - SecretKey or fileName used for storing a private key
     * @param {Function} callback - returns true if key successful stored or else returns false
     */
    this.generateStoreKey = function(type, id, callback) {
        try {
            var certManager = require("certificate_manager");
        } catch (err) {
            KeyStoreContext.emit("MODULE_MISSING", "Certificate Manager is Missing", err);
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
            KeyStoreContext.emit("FUNC_ERROR", "Private Key Generation Error", err);
        }
    };

    /**
     * Public function to fetch private key from the keyStore of the file
     * @param {String} id - fileName or secretKey for the value to be retrieved
     * @param {Function} callback - Returns true if value could be retrieved or else false
     */
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
    /**
     * Deletes key from the file or from the keyStore
     * @param {String} id - FileName or SecretKey to delete private key
     * @param {Function} callback - true if file or secretKey deleted else false
     */
    this.deleteKey = function (id, callback) {
        var key, keystore = checkPlatform();
        try {
            if(keystore) {
                keystore.delete(id);
                callback(true);
            } else {
                deleteKeyFile(id, callback);
            }
        } catch (err) {
            deleteKeyFile(id, callback);
        }
    };
};

KeyStore.prototype.__proto__ = require("events").EventEmitter.prototype;
module.exports = KeyStore;
