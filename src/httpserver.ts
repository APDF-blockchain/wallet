import express = require('express');
import * as  bodyParser from 'body-parser';

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
    private about: string = "Blockchain Project";
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
     */
    constructor() {
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

        app.get('/debug/reset-chain', (req, res) => {
            console.log(this.myHttpPort + ':GET /debug/reset-chain');
        });

        /**
         * @description - add transactions to the transaction pool.
         */
        app.post('/transactions/send', (req, res) => {
            console.log(this.myHttpPort + ':POST /transactions/send');
            // let body: Transaction[] = req.body;
            // console.log(body);
            // for (let i = 0; i < body.length; i++) {
            //     body[i].tranferSuccessful = false;
            //     this.blockchain.handleReceivedTransaction(body[i]);
            // }
            // if (body !== null) {
            //     res.status(201).send("Transaction send complete.");
            // } else {
            //     res.status(401).send("No transactions were received.");
            // }
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