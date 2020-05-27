"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServer = void 0;
const express = require("express");
const bodyParser = __importStar(require("body-parser"));
/**
 * @classdesc - contains the attributes and methods for the http server required by the blockchain
 * @class HttpServer
 */
class HttpServer {
    /**
     * @description - initializes this http server
     * @constructor
     * @param {WalletService} walletService
     * @param {TransactionService} transactionService
     */
    constructor(walletService) {
        this.walletService = walletService;
        /**
         * @description - about this block chain
         */
        this.about = "Wallet for Blockchain Project";
    }
    /**
     * @description - get the listener for this http server
     */
    getListenerUrl() {
        return this.listenerUrl;
    }
    /**
     * @description - initialize this http listener for http requests.
     * @param {number} myHttpPort - port number for this listener
     */
    initHttpServer(myHttpPort) {
        this.nodeId = (myHttpPort + Math.random()).toString();
        const app = express();
        app.use(bodyParser.json());
        /**
         * @description - http use request
         * @param err - contains any errors in the request
         * @param req - contains the http request object
         * @param res - contains the http response object
         * @param next - contains the http next object.  currently not used.
         */
        app.use((err, req, res, next) => {
            console.log('use() time:', Date.now());
            this.listenerUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
            if (err) {
                res.status(400).send(err.message);
            }
        });
        app.get('/info', (req, res) => {
            console.log(this.myHttpPort + ':GET /info');
            //this.listenerUrl = req.protocol + "://" + req.get('host') + req.originalUrl;
            this.listenerUrl = req.protocol + "://" + req.get('host');
            let rVal = {
                'about': this.about,
                'nodeId': this.nodeId,
                'nodeUrl': this.getListenerUrl()
            };
            res.send(rVal);
        });
        app.get('/debug', (req, res) => {
            console.log(this.myHttpPort + ':GET /debug');
            let hostUrl = req.get('host');
            let hostArray = hostUrl.split(':');
            let rVal = {
                'nodeId': this.nodeId,
                'host': hostArray[0],
                'port': hostArray[1],
                'selfUrl': hostUrl
            };
            res.send(rVal);
        });
        /**
         * @description - create a wallet
         */
        app.post('/wallet/create/:password', (req, res) => {
            console.log(this.myHttpPort + ':POST /wallet/:' + req.params.password);
            let rVal = this.walletService.createWallet(req.params.password);
            if (rVal !== null) {
                res.status(201).send(rVal);
            }
            else {
                res.status(401).send("Create wallet failed.");
            }
        });
        app.post('/stop', (req, res) => {
            res.send({ 'msg': 'stopping server' });
            process.exit();
        });
        app.listen(myHttpPort, () => {
            console.log('HttpServer listening http on port: ' + myHttpPort);
            this.myHttpPort = myHttpPort;
        });
    }
    ;
}
exports.HttpServer = HttpServer;
//# sourceMappingURL=httpserver.js.map