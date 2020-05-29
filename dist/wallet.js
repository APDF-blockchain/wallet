"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const httpserver_1 = require("./httpserver");
const config_1 = require("./config");
const wallet_service_1 = require("./services/wallet.service");
/**
 * @classdesc - This is the main of the wallet server
 * @class Wallet
 */
class Wallet {
    /**
     * @description - The constructor for this main class
     * @constructor
     */
    constructor() {
        /**
         * @description - The configuration object for this server
         */
        this.config = new config_1.Config();
        /**
         * @description - The port number for this server listener
         */
        this.httpPort = parseInt(process.env.HTTP_PORT) || this.config.defaultServerPort;
        this.walletService = new wallet_service_1.WalletService();
        this.httpServer = new httpserver_1.HttpServer(this.walletService);
        this.httpServer.initHttpServer(this.httpPort);
    }
}
exports.Wallet = Wallet;
let run = new Wallet();
//# sourceMappingURL=wallet.js.map