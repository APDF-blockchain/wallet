
/**
 * @classdesc - This class contains the configuration for the Node.
 * @class Config
 */
export class Config {
    /**
     * @description - default http server host
     */
    public defaultServerHost: string;
    /**
     * @description - default http server port
     */
    public defaultServerPort: number;
    /**
     * @description - faucet private key.
     */
    public faucetPrivateKey: string;
    /**
     * @description - faucet public key
     */
    public faucetPublicKey: string;
    /**
     * @description - faucet address
     */
    public faucetAddress: string;

    /**
     * @description - Class constructor initializes the configuration attributes for the entire Node/blockchain.
     * @constructor
     */
    constructor() {
        this.defaultServerHost = 'localhost';
        this.defaultServerPort = 3001;
        this.faucetPrivateKey = "838ff8634c41ba62467cc874ca156830ba55efe3e41ceeeeae5f3e77238f4eef";
        this.faucetPublicKey = '8c4431db61e9095d5794ff53a3ae4171c766cadef015f2e11bec22b98a80f74a0';
        this.faucetAddress = 'f3a1e69b6176052fcc4a3248f1c5a91dea308ca9';
    }
}