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
     */
    function writeFile(id, value) {
        try {
            fs.writeFileSync(path.resolve(path.join(webinosRoot, "keys", id)), value);
            return value;
        } catch(err){
            KeyStoreContext.emit("WRITE_ERROR", new Error("Failed Storing Key"), err);
            return undefined;
        }
    }

    /**
     * Helper function used by generateStoreKey to store keys in keystore or call writeFile to store in a file
     * @param {String} id - fileName or secretKey used for storing PEM key
     * @param {String} value - Key in PEM format
     */
    function storeKey(id, value) {
        try{
            var keystore = checkPlatform();
            if(keystore) {
                keystore.put(id, value);
                return value;
            } else {
                return writeFile(id, value);
            }
        } catch (err) { // An exception has occurred in key-store store in file instead
            return writeFile(id, value);
        }
    }

    /**
     * Helper function used by fetchKey to read private key from a file
     * @param {String} id - fileName to retrieve a private key
     */
    function getKey(id) {
        try {
            var keyPath = path.resolve(path.join(webinosRoot, "keys", id));
            var data = fs.readFileSync(keyPath);
            return data.toString();
        } catch(err) {
            KeyStoreContext.emit("READ_ERROR", new Error("Failed Fetching Key"), err);
            return undefined;
        }
    }

    /**
     * Helper function to delete private key from a file
     * @param {String} id - FileName of the private key
     */
    function deleteKeyFile(id){
        try {
            var keyPath = path.resolve(path.join(webinosRoot, "keys", id));
            fs.unlinkSync(keyPath);
            return true;
        } catch(err){
            KeyStoreContext.emit("CLEANUP_ERROR", new Error("Failed Deleting Key"), err);
            return false;
        }
    }
    /**
     * Public function to generate private key and store key
     * @param {String} type - Webinos type, used for using different key size for client and server
     * @param {String} id - SecretKey or fileName used for storing a private key
     */
    this.generateStoreKey = function(type, id) {
        try {
            var certManager = require("certificate_manager");
        } catch (err) {
            KeyStoreContext.emit("MODULE_MISSING", new Error("Certificate Manager is Missing"), err);
            return undefined;
        }
        try {
            var key;
            if (type === "PzhPCA" ||  type === "PzhCA" || type === "PzpCA"){
                key = certManager.genRsaKey(2048);
            } else {
                key = certManager.genRsaKey(1024);
            }
            return storeKey(id, key);
        } catch(err) {
            KeyStoreContext.emit("FUNC_ERROR", new Error("Private Key Generation Error"), err);
            return undefined;
        }
    };

    /**
     * Public function to fetch private key from the keyStore of the file
     * @param {String} id - fileName or secretKey for the value to be retrieved
     */
    this.fetchKey = function (id) {
        var key, keystore = checkPlatform();
        try {
            if(keystore) {
                key = keystore.get(id);
                if (key.search("-----BEGIN RSA PRIVATE KEY-----") !== -1) {
                    return key;
                } else {
                    return getKey(id);
                }
            } else {
                return getKey(id);
            }
        } catch (err) {
            return getKey(id);
        }
    };
    /**
     * Deletes key from the file or from the keyStore
     * @param {String} id - FileName or SecretKey to delete private key
     */
    this.deleteKey = function (id) {
        var key, keystore = checkPlatform();
        try {
            if(keystore) {
                keystore.delete(id);
                return true;
            } else {
                return deleteKeyFile(id);
            }
        } catch (err) {
            return deleteKeyFile(id);
        }
    };
};

KeyStore.prototype.__proto__ = require("events").EventEmitter.prototype;
module.exports = KeyStore;
