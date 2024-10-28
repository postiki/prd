import {createServer} from "http";
import config from "./config";
import {app} from "./app";
import {db} from "./db";


class Index {
    private static server = createServer(app);

    public static async start(): Promise<void> {
        await db.initialize().catch(e => console.log(e))
        await this.listen()
        await console.log(`listening at :${config.port}`);
    }

    private static listen(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.on('listening', resolve);
            this.server.on('error', (err: any) => {
                console.error(err);
                reject(err);
            });
            this.server.listen(config.port);
        });
    }
}

Index.start().catch((err) => {
    console.error(err);
});