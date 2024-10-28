import express from 'express';
import AuthMiddleware from "../middlewares/AuthMiddleware";
import {PlayerController} from "./player-controller";

export class RootController {
    public readonly router = express.Router();

    constructor() {
        this.router.use('/player', AuthMiddleware, new PlayerController().router)
    }
}