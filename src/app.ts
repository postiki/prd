import express from "express";
import cors from "cors";
import {RootController} from "./controllers";
import {createServer} from "http";
import {Server} from "socket.io";
import {BattleService} from "./services/battle-service";

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/', new RootController().router);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", // Your frontend URL
        methods: ["GET", "POST"]
    }
});

export { app, httpServer, io };