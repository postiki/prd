import express, {Request, Response} from 'express';
import {RootService} from "../services";

export class PlayerController {
    public readonly router = express.Router();

    constructor() {
        this.router.post('/register', this.register);

        this.router.get('/auth/:walletAddress', this.getState);
        this.router.post('/:packId/open', this.openPack);

        this.router.post('/purchase/pack', this.purchasePack);
        this.router.post('/purchase/ticket', this.purchaseTicket);
    }

    async register(req: Request, res: Response) {
        try {
            const {walletAddress, username} = req.body;
            const player = await RootService.I.playerService.registerPlayer(walletAddress, username);
            res.json({success: true, player});
        } catch (error: any) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    async getState(req: Request, res: Response) {
        try {
            const {walletAddress} = req.params;
            const playerState = await RootService.I.playerService.getPlayerState(walletAddress);
            res.json({success: true, playerState});
        } catch (error: any) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    private async openPack(req: Request, res: Response) {
        try {
            const {packId} = req.params;
            const walletAddress = req.headers['wallet-address'] as string;

            if (!walletAddress) {
                return res.status(401).json({
                    success: false,
                    error: 'Wallet address is required'
                });
            }

            const cards = await RootService.I.packService.openPack(packId, walletAddress);

            return res.json({
                success: true,
                data: {
                    cards,
                    message: `Successfully opened pack and received ${cards.length} cards`
                }
            });

        } catch (error: any) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    async purchasePack(req: Request, res: Response) {
        try {
            const { walletAddress, currency } = req.body;

            const result = await RootService.I.purchaseService.purchasePack(walletAddress, currency);

            res.json({
                success: true,
                data: result
            });

        } catch (error: any) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    async purchaseTicket(req: Request, res: Response) {
        try {
            const { walletAddress, currency } = req.body;

            const result = await RootService.I.purchaseService.purchaseTicket(walletAddress, currency);

            res.json({
                success: true,
                data: result
            });

        }  catch (error: any) {
            res.status(400).json({success: false, error: error.message});
        }
    }

}
