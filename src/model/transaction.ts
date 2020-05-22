import { TxIn } from './tx-in';
import { TxOut } from './tx-out';

export class Transaction {
  public id: string;

  public txIns: TxIn[];
  public txOuts: TxOut[];

  constructor() {

  }
}
