import { ec } from 'elliptic';
//const fs = require('fs');
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import * as _ from 'lodash';

import { TransactionService } from './transaction.service';
import { UnspentTxOut } from '../model/unspent-tx-out';
import { TxOut } from '../model/tx-out';
import { Transaction } from '../model/transaction';
import { TxIn } from '../model/tx-in';

export class WalletService {

  public EC = new ec('secp256k1');
  private privateKeyLocation = 'node/wallet/private_key';

  constructor(private transactionService: TransactionService) {
    console.log('Hello');
  }

  public getPrivateFromWallet(): string {
    const buffer = readFileSync(this.privateKeyLocation, 'utf8');
    return buffer.toString();
  }

  public getPublicFromWallet(): string  {
    const privateKey = this.getPrivateFromWallet();
    const key = this.EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex', false); // TODO: determine if false is the correct second argument.
  }

  public generatePrivateKey(): string {
    const keyPair = this.EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
  }

  public initWallet() {
    // let's not override existing private keys
    if (existsSync(this.privateKeyLocation)) {
      return;
    }
    const newPrivateKey = this.generatePrivateKey();

    writeFileSync(this.privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created');
  }

  public getBalance(address: string, unspentTxOuts: UnspentTxOut[]): number {
    return _(unspentTxOuts)
      .filter((uTxO: UnspentTxOut) => uTxO.address === address)
      .map((uTxO: UnspentTxOut) => uTxO.amount)
      .sum();
  }

  public findTxOutsForAmount(amount: number, myUnspentTxOuts: UnspentTxOut[]) {
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

  public createTxOuts(receiverAddress: string, myAddress: string, amount: number, leftOverAmount: number) {
    const txOut1: TxOut = new TxOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
      return [txOut1];
    } else {
      const leftOverTx = new TxOut(myAddress, leftOverAmount);
      return [txOut1, leftOverTx];
    }
  }

  public createTransaction(receiverAddress: string, amount: number,
    privateKey: string, unspentTxOuts: UnspentTxOut[]): Transaction {

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
