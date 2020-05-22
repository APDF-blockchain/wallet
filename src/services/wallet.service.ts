import { ec } from 'elliptic';
//const fs = require('fs');
import { existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
//import * as _ from 'lodash';
import { ethers } from 'ethers';

import { TransactionService } from './transaction.service';
import { UnspentTxOut } from '../model/unspent-tx-out';
import { TxOut } from '../model/tx-out';
import { Transaction } from '../model/transaction';
import { TxIn } from '../model/tx-in';

/**
 * @classdesc - This class contains the wallet services.
 * @class WalletService
 */
export class WalletService {

  public EC = new ec('secp256k1');
  private privateKeyLocation = 'node/wallet/private_key';
  private privateKeyDirectory = 'node/wallet/';

  /**
   * @constructor
   * @param {TransactionService} transactionService 
   */
  constructor(private transactionService: TransactionService) {
    console.log('WalletService created.');
  }

  /**
   * @description - create a wallet.
   * @param {string} password 
   * @returns {'mnemonic': mnemonic, 'filename': filename} object
   */
  public createWallet(password: string): { 'mnemonic': string, 'filename': string } {
    const randomEntropyBytes = ethers.utils.randomBytes(16);
    const mnemonic = ethers.utils.HDNode.entropyToMnemonic(randomEntropyBytes);
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const filename = "UTC_JSON_WALLET_" + Math.round(+ new Date() / 1000) + "_" + +(Math.floor(Math.random() * 200001) - 10000) + ".json";

    wallet.encrypt(password).then((jsonWallet) => {
      writeFileSync(this.privateKeyDirectory + filename, jsonWallet, 'utf-8');
    });
    let rVal = {'mnemonic': mnemonic, 'filename': filename};
    return rVal;
  }

  private getPrivateKeyFromWallet(): string {
    const buffer = readFileSync(this.privateKeyLocation, 'utf8');
    return buffer.toString();
  }

  public getPublicKeyFromWallet(): string {
    const privateKey = this.getPrivateKeyFromWallet();
    const key = this.EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex', false); // TODO: determine if false is the correct second argument.
  }

  public generatePrivateKey(): string {
    const keyPair = this.EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
  }

  public initWallet(): void {
    // let's not override existing private keys
    if (existsSync(this.privateKeyLocation)) {
      return;
    }
    const newPrivateKey = this.generatePrivateKey();

    writeFileSync(this.privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created');
  }

  public getBalance(address: string, unspentTxOuts: UnspentTxOut[]): number {
    // return _(unspentTxOuts)
    //   .filter((uTxO: UnspentTxOut) => uTxO.address === address)
    //   .map((uTxO: UnspentTxOut) => uTxO.amount)
    //   .sum();
    let rVal: number = 0;
    for (let i = 0; i < unspentTxOuts.length; i++) {
      if (unspentTxOuts[i].address === address) {
        rVal += unspentTxOuts[i].amount;
      }
    }
    return rVal;
  }

  public findTxOutsForAmount(amount: number, myUnspentTxOuts: UnspentTxOut[]): { 'includedUnspentTxOuts': any[], 'leftOverAmount': number } {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
      includedUnspentTxOuts.push(myUnspentTxOut);
      currentAmount = currentAmount + myUnspentTxOut.amount;
      if (currentAmount >= amount) {
        const leftOverAmount = currentAmount - amount;
        return { includedUnspentTxOuts, leftOverAmount };
      }
    }
    throw Error('not enough coins to send transaction');
  }

  public createTxOuts(receiverAddress: string, myAddress: string, amount: number, leftOverAmount: number): any[] {
    const txOut1: TxOut = new TxOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
      return [txOut1];
    } else {
      const leftOverTx = new TxOut(myAddress, leftOverAmount);
      return [txOut1, leftOverTx];
    }
  }

  public createTransaction(
    receiverAddress: string,
    amount: number,
    privateKey: string,
    unspentTxOuts: UnspentTxOut[]): Transaction {

    const myAddress: string = this.transactionService.getPublicKey(privateKey);
    const myUnspentTxOuts = unspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.address === myAddress);

    const { includedUnspentTxOuts, leftOverAmount } = this.findTxOutsForAmount(amount, myUnspentTxOuts);

    const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
      const txIn: TxIn = new TxIn();
      txIn.txOutId = unspentTxOut.txOutId;
      txIn.txOutIndex = unspentTxOut.txOutIndex;
      return txIn;
    }

    const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn);

    const tx: Transaction = new Transaction();
    tx.txIns = unsignedTxIns;
    tx.txOuts = this.createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
    tx.id = this.transactionService.getTransactionId(tx);

    tx.txIns = tx.txIns.map((txIn: TxIn, index: number) => {
      txIn.signature = this.transactionService.signTxIn(tx, index, privateKey, unspentTxOuts);
      return txIn;
    });

    return tx;
  }
}
