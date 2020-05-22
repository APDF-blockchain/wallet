import express = require('express');
import * as  bodyParser from 'body-parser';
import { WalletService } from './services/wallet.service';
import { TransactionService } from './services/transaction.service';
import { UnspentTxOut } from './model/unspent-tx-out';

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
    constructor(private walletService: WalletService, private transactionService: TransactionService) {
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

        app.get('/blocks', (req, res) => {
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

        app.get('/wallet/balance/:address', (req, res) => {
            console.log(this.myHttpPort + ':GET /wallet/balance/:' + req.params.address);
            // https://website.com/example?myarray[]=136129&myarray[]=137794&myarray[]=137792
            // To retrieve it from express:
            // console.log(req.query.myarray) for me this would be unspentTxOuts instead of myarray
            // [ '136129', '137794', '137792' ]
            //let rVal: number = this.walletService.getBalance(req.params.address, []);
            // public readonly txOutId: string;
            // public readonly txOutIndex: number;
            // public readonly address: string;
            // public readonly amount: number
            // http://localhost:4001/wallet/balance/f3a1e69b6176052fcc4a3248f1c5a91dea308ca9?unspentTxOuts[]={'txOutId': "1", 'txOutIndex': 1, 'address': "someadress", 'amount': 10}
            let address: string = req.params.address;
            let unspentTxOuts: UnspentTxOut[] = req.query.unspentTxOuts;
            let rVal: number = 0;
            rVal = this.walletService.getBalance(req.params.address, unspentTxOuts);
            res.send(JSON.stringify(rVal));
        });

        /**
         * @description - initialize the wallet
         */
        app.post('/wallet/init', (req, res) => {
            console.log(this.myHttpPort + ':POST /wallet/init');
            this.walletService.initWallet();
            res.status(201).send("Transaction send complete.");
            //     res.status(401).send("No transactions were received.");
        });


        app.post('/peers/notify-new-block', (req, res) => {
            console.log(this.myHttpPort + ':POST /peers/notify-new-block');
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