import express = require('express');
import * as  bodyParser from 'body-parser';
import { WalletService } from './services/wallet.service';

/**
 * @classdesc - contains the attributes and methods for the http server required by the blockchain
 * @class HttpServer
 */
export class HttpServer {

    /**
     * @description - http listener url
     */
    private listenerUrl: string;
    /**
     * @description - about this block chain
     */
    private about: string = "Wallet for Blockchain Project";
    /**
     * @description - the ID of the Node that contains the blockchain
     */
    private nodeId: string;
    /**
     * @description - the http port number to listen on for http requests.
     */
    private myHttpPort: number;

    /**
     * @description - initializes this http server
     * @constructor
     * @param {WalletService} walletService
     * @param {TransactionService} transactionService
     */
    constructor(private walletService: WalletService) {
    }

    /**
     * @description - get the listener for this http server
     */
    public getListenerUrl(): string {
        return this.listenerUrl;
    }

    /**
     * @description - initialize this http listener for http requests.
     * @param {number} myHttpPort - port number for this listener
     */
    public initHttpServer(myHttpPort: number) {
        this.nodeId = (myHttpPort + Math.random()).toString();
        const app: express.Application = express();
        app.use(bodyParser.json());

        /**
         * @description - http use request
         * @param err - contains any errors in the request
         * @param req - contains the http request object
         * @param res - contains the http response object
         * @param next - contains the http next object.  currently not used.
         */
        app.use((err, req, res, next) => {
            console.log('use() time:', Date.now())
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
            let hostUrl: string = req.get('host');
            let hostArray: string[] = hostUrl.split(':');
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
            let rVal: any = this.walletService.createWallet(req.params.password);
            if (rVal !== null) {
                res.status(201).send(rVal);
            } else {
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
    };
}