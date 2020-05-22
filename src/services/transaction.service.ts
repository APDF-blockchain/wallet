import { sha256, sha224 } from 'js-sha256';
import { Transaction } from '../model/transaction';
import { TxIn } from '../model/tx-in';
import { TxOut } from '../model/tx-out';
import { UnspentTxOut } from '../model/unspent-tx-out';
//import { ec } from 'elliptic';
import * as ecdsa from 'elliptic';
import * as _ from 'lodash';

export class TransactionService {
  public ec = new ecdsa.ec('secp256k1');

  public COINBASE_AMOUNT: number = 50;

  constructor() { 
    console.log('TransactionService created.');
  }

  public getTransactionId(transaction: Transaction): string {
    const txInContent: string = transaction.txIns
      .map((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
      .reduce((a, b) => a + b, '');

    const txOutContent: string = transaction.txOuts
      .map((txOut: TxOut) => txOut.address + txOut.amount)
      .reduce((a, b) => a + b, '');

    // return CryptoJS.SHA256(txInContent + txOutContent).toString();
    return sha256(txInContent + txOutContent);
  }

  public validateTransaction(transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean {

    if (this.getTransactionId(transaction) !== transaction.id) {
      console.log('invalid tx id: ' + transaction.id);
      return false;
    }
    const hasValidTxIns: boolean = transaction.txIns
      .map((txIn) => this.validateTxIn(txIn, transaction, aUnspentTxOuts))
      .reduce((a, b) => a && b, true);

    if (!hasValidTxIns) {
      console.log('some of the txIns are invalid in tx: ' + transaction.id);
      return false;
    }

    const totalTxInValues: number = transaction.txIns
      .map((txIn) => this.getTxInAmount(txIn, aUnspentTxOuts))
      .reduce((a, b) => (a + b), 0);

    const totalTxOutValues: number = transaction.txOuts
      .map((txOut) => txOut.amount)
      .reduce((a, b) => (a + b), 0);

    if (totalTxOutValues !== totalTxInValues) {
      console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction.id);
      return false;
    }

    return true;
  }

  public validateBlockTransactions(aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number): boolean {
    const coinbaseTx = aTransactions[0];
    if (!this.validateCoinbaseTx(coinbaseTx, blockIndex)) {
      console.log('invalid coinbase transaction: ' + JSON.stringify(coinbaseTx));
      return false;
    }

    // check for duplicate txIns. Each txIn can be included only once
    const txIns: TxIn[] = _(aTransactions)
      .map((tx) => tx.txIns)
      .flatten()
      .value();

    if (this.hasDuplicates(txIns)) {
      return false;
    }

    // all but coinbase transactions
    const normalTransactions: Transaction[] = aTransactions.slice(1);
    return normalTransactions.map((tx) => this.validateTransaction(tx, aUnspentTxOuts))
      .reduce((a, b) => (a && b), true);

  }

  public hasDuplicates(txIns: TxIn[]): boolean {
    const groups = _.countBy(txIns, (txIn: TxIn) => txIn.txOutId + txIn.txOutIndex);
    return _(groups)
      .map((value, key) => {
        if (value > 1) {
          console.log('duplicate txIn: ' + key);
          return true;
        } else {
          return false;
        }
      })
      .includes(true);
  }

  public validateCoinbaseTx(transaction: Transaction, blockIndex: number): boolean {
    if (transaction == null) {
      console.log('the first transaction in the block must be coinbase transaction');
      return false;
    }
    if (this.getTransactionId(transaction) !== transaction.id) {
      console.log('invalid coinbase tx id: ' + transaction.id);
      return false;
    }
    if (transaction.txIns.length !== 1) {
      console.log('one txIn must be specified in the coinbase transaction');
      return;
    }
    if (transaction.txIns[0].txOutIndex !== blockIndex) {
      console.log('the txIn signature in coinbase tx must be the block height');
      return false;
    }
    if (transaction.txOuts.length !== 1) {
      console.log('invalid number of txOuts in coinbase transaction');
      return false;
    }
    if (transaction.txOuts[0].amount !== this.COINBASE_AMOUNT) {
      console.log('invalid coinbase amount in coinbase transaction');
      return false;
    }
    return true;
  }

  public validateTxIn(txIn: TxIn, transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean {
    const referencedUTxOut: UnspentTxOut =
      aUnspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
    if (referencedUTxOut == null) {
      console.log('referenced txOut not found: ' + JSON.stringify(txIn));
      return false;
    }
    const address = referencedUTxOut.address;

    const key = this.ec.keyFromPublic(address, 'hex');
    const validSignature: boolean = key.verify(transaction.id, txIn.signature);
    if (!validSignature) {
      console.log('invalid txIn signature: %s txId: %s address: %s', txIn.signature, transaction.id, referencedUTxOut.address);
      return false;
    }
    return true;
  }

  public getTxInAmount(txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number {
    return this.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
  }

  public findUnspentTxOut(transactionId: string, index: number, aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut {
    return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
  }

  public getCoinbaseTransaction(address: string, blockIndex: number): Transaction {
    const t = new Transaction();
    const txIn: TxIn = new TxIn();
    txIn.signature = '';
    txIn.txOutId = '';
    txIn.txOutIndex = blockIndex;

    t.txIns = [txIn];
    t.txOuts = [new TxOut(address, this.COINBASE_AMOUNT)];
    t.id = this.getTransactionId(t);
    return t;
  }

  public signTxIn(transaction: Transaction, txInIndex: number,
    privateKey: string, aUnspentTxOuts: UnspentTxOut[]): string {
    const txIn: TxIn = transaction.txIns[txInIndex];

    const dataToSign = transaction.id;
    const referencedUnspentTxOut: UnspentTxOut = this.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
    if (referencedUnspentTxOut == null) {
      console.log('could not find referenced txOut');
      throw Error();
    }
    const referencedAddress = referencedUnspentTxOut.address;

    if (this.getPublicKey(privateKey) !== referencedAddress) {
      console.log('trying to sign an input with private' +
        ' key that does not match the address that is referenced in txIn');
      throw Error();
    }
    const key = this.ec.keyFromPrivate(privateKey, 'hex');
    const signature: string = this.toHexString(key.sign(dataToSign).toDER());

    return signature;
  }

  public updateUnspentTxOuts(aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut[] {
    const newUnspentTxOuts: UnspentTxOut[] = aTransactions
      .map((t) => {
        return t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.address, txOut.amount));
      })
      .reduce((a, b) => a.concat(b), []);

    const consumedTxOuts: UnspentTxOut[] = aTransactions
      .map((t) => t.txIns)
      .reduce((a, b) => a.concat(b), [])
      .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));

    const resultingUnspentTxOuts = aUnspentTxOuts
      .filter(((uTxO) => !this.findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
      .concat(newUnspentTxOuts);

    return resultingUnspentTxOuts;
  }

  public processTransactions(aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number) {

    if (!this.isValidTransactionsStructure(aTransactions)) {
      return null;
    }

    if (!this.validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
      console.log('invalid block transactions');
      return null;
    }
    return this.updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
  }

  public toHexString(byteArray): string {
    return Array.from(byteArray, (byte: any) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }

  public getPublicKey(aPrivateKey: string): string {
    return this.ec.keyFromPrivate(aPrivateKey, 'hex').getPublic().encode('hex', false); // TODO: check this for a false?
  }

  public isValidTxInStructure(txIn: TxIn): boolean {
    if (txIn == null) {
      console.log('txIn is null');
      return false;
    } else if (typeof txIn.signature !== 'string') {
      console.log('invalid signature type in txIn');
      return false;
    } else if (typeof txIn.txOutId !== 'string') {
      console.log('invalid txOutId type in txIn');
      return false;
    } else if (typeof txIn.txOutIndex !== 'number') {
      console.log('invalid txOutIndex type in txIn');
      return false;
    } else {
      return true;
    }
  }

  public isValidTxOutStructure(txOut: TxOut): boolean {
    if (txOut == null) {
      console.log('txOut is null');
      return false;
    } else if (typeof txOut.address !== 'string') {
      console.log('invalid address type in txOut');
      return false;
    } else if (!this.isValidAddress(txOut.address)) {
      console.log('invalid TxOut address');
      return false;
    } else if (typeof txOut.amount !== 'number') {
      console.log('invalid amount type in txOut');
      return false;
    } else {
      return true;
    }
  }

  public isValidTransactionsStructure(transactions: Transaction[]): boolean {
    return transactions
      .map(this.isValidTransactionStructure)
      .reduce((a, b) => (a && b), true);
  }

  public isValidTransactionStructure(transaction: Transaction) {
    if (typeof transaction.id !== 'string') {
      console.log('transactionId missing');
      return false;
    }
    if (!(transaction.txIns instanceof Array)) {
      console.log('invalid txIns type in transaction');
      return false;
    }
    if (!transaction.txIns
      .map(this.isValidTxInStructure)
      .reduce((a, b) => (a && b), true)) {
      return false;
    }

    if (!(transaction.txOuts instanceof Array)) {
      console.log('invalid txIns type in transaction');
      return false;
    }

    if (!transaction.txOuts
      .map(this.isValidTxOutStructure)
      .reduce((a, b) => (a && b), true)) {
      return false;
    }
    return true;
  }

  // valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
  public isValidAddress(address: string): boolean {
    if (address.length !== 130) {
      console.log('invalid public key length');
      return false;
    } else if (address.match('^[a-fA-F0-9]+$') === null) {
      console.log('public key must contain only hex characters');
      return false;
    } else if (!address.startsWith('04')) {
      console.log('public key must start with 04');
      return false;
    }
    return true;
  }
}
