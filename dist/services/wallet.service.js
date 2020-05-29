"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const fs_1 = require("fs");
const ethers_1 = require("ethers");
/**
 * @classdesc - This class contains the wallet services.
 * @class WalletService
 */
class WalletService {
    /**
     * @constructor
     */
    constructor() {
        /**
         * @description - the wallet directory
         */
        this.walletDirectory = 'node/wallet/';
        console.log('WalletService created.');
    }
    /**
     * @description - create a wallet.
     * @param {string} password
     * @returns {'mnemonic': mnemonic, 'filename': filename} object
     */
    createWallet(password) {
        const randomEntropyBytes = ethers_1.ethers.utils.randomBytes(16);
        const mnemonic = ethers_1.ethers.utils.HDNode.entropyToMnemonic(randomEntropyBytes);
        const wallet = ethers_1.ethers.Wallet.fromMnemonic(mnemonic);
        const filename = "UTC_JSON_WALLET_" + Math.round(+new Date() / 1000) + "_" + +(Math.floor(Math.random() * 200001) - 10000) + ".json";
        wallet.encrypt(password).then((jsonWallet) => {
            fs_1.writeFileSync(this.walletDirectory + filename, jsonWallet, 'utf-8');
        });
        let address = wallet.address;
        let privateKey = wallet.privateKey;
        let rVal = { 'myAddress': address, 'mnemonic': mnemonic, 'privateKey': privateKey, 'filename': filename };
        return rVal;
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map