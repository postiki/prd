import {Player} from "../db/models/indext";
import {db} from "../db";

export class PlayerService {
    async registerPlayer(walletAddress: string, username: string): Promise<Player> {
        const existingPlayer = await this.findByWallet(walletAddress);
        if (existingPlayer) {
            throw new Error('Player with this wallet already exists');
        }

        const player = new Player();
        player.walletAddress = walletAddress;
        player.username = username;
        player.balance = 0;

        return db.getRepository(Player).save(player);
    }

    async findByWallet(walletAddress: string): Promise<Player | null> {
        return db.getRepository(Player).findOne({
            where: { walletAddress },
            relations: {
                cards: true,
                packs: true,
                tickets: true
            }
        });
    }

    async getPlayerState(walletAddress: string): Promise<Player> {
        const player = await this.findByWallet(walletAddress);
        if (!player) {
            throw new Error('Player not found');
        }
        return player;
    }

    async updateBalance(walletAddress: string, amount: number): Promise<Player> {
        const player = await this.findByWallet(walletAddress);
        if (!player) {
            throw new Error('Player not found');
        }

        player.balance += amount;
        if (player.balance < 0) {
            throw new Error('Insufficient balance');
        }

        return db.getRepository(Player).save(player);
    }
}