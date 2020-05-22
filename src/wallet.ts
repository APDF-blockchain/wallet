import { HttpServer } from "./httpserver";
import { Config } from "./config";
import { WalletService } from "./services/wallet.service";

/**
 * @classdesc - This is the main of the wallet server
 * @class Wallet
 */
export class Wallet {
    /**
     * @description - The http service object
     */
    public httpServer: HttpServer;
    /**
     * @description - The configuration object for this server
     */
    public config: Config = new Config();
    /**
     * @description - The port number for this server listener
     */
    public httpPort: number = parseInt(process.env.HTTP_PORT) || this.config.defaultServerPort;
    /**
     * @description - The wallet service 
     */
    public walletService: WalletService;

    /**
     * @description - The constructor for this main class
     * @constructor
     */
    constructor() {
        this.walletService = new WalletService();
        this.httpServer = new HttpServer(this.walletService);
        this.httpServer.initHttpServer(this.httpPort);
    }
}

let run = new Wallet();