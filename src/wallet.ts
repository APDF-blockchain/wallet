import { HttpServer } from "./httpserver";
import { Config } from "./config";
import { TransactionService } from "./services/transaction.service";
import { WalletService } from "./services/wallet.service";

/**
 * @classdesc - This is the main of the wallet server
 * @class Wallet
 */
export class Wallet {
    public httpServer: HttpServer;
    public config: Config = new Config();
    public httpPort: number = parseInt(process.env.HTTP_PORT) || this.config.defaultServerPort;
    public transactionService: TransactionService;
    public walletService: WalletService;
    constructor() {
        this.transactionService = new TransactionService();
        this.walletService = new WalletService(this.transactionService);
        this.httpServer = new HttpServer();
        this.httpServer.initHttpServer(this.httpPort);
    }
}

let run = new Wallet();