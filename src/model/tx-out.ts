/**
 * @classdesc - This class somthing, something, something
 * @class TxOut
 */
export class TxOut {
  /**
   * @description - address of something.
   */
  public address: string;
  /**
   * @description - amount of something.
   */
  public amount: number;

  /**
   * @description - constructor to create this object
   * @param {string} address - address of something
   * @param {number} amount - amount of something
   */
  constructor(address: string, amount: number) {
    this.address = address;
    this.amount = amount;
  }
}
