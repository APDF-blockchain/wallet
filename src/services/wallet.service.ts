import { ec } from 'elliptic';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { ethers } from 'ethers';

/**
 * @classdesc - This class contains the wallet services.
 * @class WalletService
 */
export class WalletService {

  /**
   * @description - the wallet directory
   */
  private walletDirectory = 'node/wallet/';

  /**
   * @constructor
   */
  constructor() {
    console.log('WalletService created.');
  }

  /**
   * @description - create a wallet.
   * @param {string} password 
   * @returns { 'address': address, 'mnemonic': mnemonic, 'privateKey': privateKey, 'publicKey': publicKey, 'filename': filename } object
   */
  public createWallet(password: string): { 'address' : string, 'mnemonic': string, 'privateKey' : string, 'publicKey' : string, 'filename': string } {
    const randomEntropyBytes = ethers.utils.randomBytes(16);
    const mnemonic = ethers.utils.HDNode.entropyToMnemonic(randomEntropyBytes);
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const filename = "UTC_JSON_WALLET_" + Math.round(+ new Date() / 1000) + "_" + +(Math.floor(Math.random() * 200001) - 10000) + ".json";

    wallet.encrypt(password).then((jsonWallet) => {
      writeFileSync(this.walletDirectory + filename, jsonWallet, 'utf-8');
    });

    let address = wallet.address;
    let privateKey = wallet.privateKey;
    let signingKey = new ethers.utils.SigningKey(privateKey);
    let publicKey = signingKey.publicKey;
    let compressedPublicKey = ethers.utils.computePublicKey(publicKey, true);
    let rVal = { 'address' : address, 'mnemonic': mnemonic, 'privateKey' : privateKey, 'publicKey' : compressedPublicKey,'filename': filename };
    return rVal;
  }

}
