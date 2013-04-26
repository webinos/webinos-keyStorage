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
    var userData, keyStorage; // OwnInstance
    var KeyStoreContext = this;
    if (!webinosType || !webinosRoot) {
        this.emit("PARAMS_MISSING", new Error("Webinos Type/Root are missing. KeyStorage will not work correctly- "+ err.message));
        return undefined;
    }
    if (!(userData = (require("webinos-utilities").loadConfig(path.join(__dirname,"..","config.json"))))){
        this.emit("PARAMS_MISSING", new Error("KeyStorage storageType is missing - "+ err.message));
        return undefined;
    }
    if(!require.resolve("webinos-utilities")) {
        this.emit("MODULE_MISSING", new Error("Webinos utilities is missing - "+ err.message));
        return undefined;
    }
    /**
     * KeyStore is supported only on Linux and Mac platform, this function does platform check and loads keyStorage or else fs.
     * On linux platform too if gnome-keyring is not present. Using config.json, user can set to default values
     */
    this.initializeKeyStorage = function() {
        KeyStoreContext.webinosType = webinosType;
        KeyStoreContext.webinosRoot = webinosRoot; 
        if (KeyStoreContext.webinosType ==="Pzp" && (os.type().toLowerCase() ==="linux" &&
            os.platform().toLowerCase() !== "android") || os.type().toLowerCase() === "darwin") {
            if (userData && userData.params && userData.params.storageType === "keyStorage") {
                try {
                    if (!keyStorage) keyStorage = require("keystore");
                } catch (err) {
                    KeyStoreContext.emit("MODULE_MISSING", new Error("KeyStorage manager compiled module is missing." +
                        "run node-gyp configure build to trigger keyStorage manager build and try again "+ err.message));
                }
            } 
        }    
       
        var logger = require("webinos-utilities").webinosLogging(__filename);
	    // All these exceptions are handled also in the PZP
        KeyStoreContext.on("READ_ERROR", function(errMsg){
		      logger.log("Encountered a read error " + errMsg);
   		  });
        KeyStoreContext.on("WRITE_ERROR", function(errMsg){
		      logger.log("Encountered a write error "+ errMsg);
        });
        KeyStoreContext.on("CLEANUP_ERROR", function(errMsg){
		      logger.log("Deleting of private key failed "+ errMsg);
        });
        KeyStoreContext.on("FUNC_ERROR", function(errMsg){
		      logger.log("Encountered a functionality error "+ errMsg);
        });
    }
    /**
     * Public function to store key
     * @param {String} id - SecretKey or fileName used for storing a private key
     * @param {String} value - private key
     */
    this.storeKey = function(id, value) {
        try{
            if (userData && userData.params && userData.params.storageType === "keyStorage") {
               keyStorage.put(id, value);
            } else {
               fs.writeFileSync(path.resolve(path.join(KeyStoreContext.webinosRoot, "keys", id)), value);
            }
            return value;
        } catch (err) { // An exception has occurred in key-store store in file instead
            KeyStoreContext.emit("WRITE_ERROR", new Error("Failed Storing Key -"+ err));
            return undefined;
        }
    };

    /**
     * Public function to fetch private key from the keyStore of the file
     * @param {String} id - fileName or secretKey for the value to be retrieved
     */
    this.fetchKey = function (id) {
        var key;
        try {
            if (userData && userData.params && userData.params.storageType === "keyStorage") {
               return keyStorage.get(id);
            } else {
               var data = fs.readFileSync(path.resolve(path.join(KeyStoreContext.webinosRoot, "keys", id)));
               return data.toString();
            }
        } catch (err) {
            KeyStoreContext.emit("READ_ERROR", new Error("Failed Fetching Key -" + err));
            return undefined;        }
    };
    /**
     * Deletes key from the file or from the keyStore
     * @param {String} id - FileName or SecretKey to delete private key
     */
    this.deleteKey = function (id) {
        try {
            if(userData && userData.params && userData.params.storageType === "keyStorage") {
                 return keyStorage.delete(id);
            } else {
                fs.unlinkSync(path.resolve(path.join(KeyStoreContext.webinosRoot, "keys", id)));
                return true;
            }
        } catch (err) {
            KeyStoreContext.emit("CLEANUP_ERROR", new Error("Failed Deleting Key - "+ err));
            return false;
        }
    };   
    this.initializeKeyStorage();
};

KeyStore.prototype.__proto__ = require("events").EventEmitter.prototype;
module.exports = KeyStore;
