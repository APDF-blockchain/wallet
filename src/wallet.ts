import { HttpServer } from "./httpserver";
import { Config } from "./config";

export class Wallet {
    public httpServer: HttpServer;
    public config: Config = new Config()
    public httpPort: number = parseInt(process.env.HTTP_PORT) || this.config.defaultServerPort
    constructor() {
        this.httpServer = new HttpServer();
        this.httpServer.initHttpServer(this.httpPort);
    }
}

let run = new Wallet();