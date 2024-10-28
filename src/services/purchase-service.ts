import {Pack, Player, Ticket} from "../db/models/indext";
import {db} from "../db";

export class PurchaseService {
    private readonly PACK_PRICE = 10;
    private readonly TICKET_PRICE = 5; //TODO move to some place


    async purchasePack(walletAddress: string, currency: string): Promise<{pack: Pack, remainingBalance: number}> {
        const queryRunner = db.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const player = await queryRunner.manager.findOne(Player, {
                where: { walletAddress }
            });

            if (!player) {
                throw new Error('Player not found');
            }

            if (player.balance < this.PACK_PRICE) {
                throw new Error('Insufficient balance');
            }

            const pack = new Pack();
            pack.owner = player;
            pack.price = this.PACK_PRICE;
            pack.currency = currency;
            pack.isOpened = false;

            player.balance -= this.PACK_PRICE;

            await queryRunner.manager.save(player);
            const savedPack = await queryRunner.manager.save(pack);

            await queryRunner.commitTransaction();

            return {
                pack: savedPack,
                remainingBalance: player.balance
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async purchaseTicket(walletAddress: string, currency: string): Promise<{ticket: Ticket, remainingBalance: number}> {
        const queryRunner = db.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const player = await queryRunner.manager.findOne(Player, {
                where: { walletAddress }
            });

            if (!player) {
                throw new Error('Player not found');
            }

            if (player.balance < this.TICKET_PRICE) {
                throw new Error('Insufficient balance');
            }

            const ticket = new Ticket();
            ticket.owner = player;
            ticket.price = this.TICKET_PRICE;
            ticket.currency = currency;
            ticket.isUsed = false;

            player.balance -= this.TICKET_PRICE;

            await queryRunner.manager.save(player);
            const savedTicket = await queryRunner.manager.save(ticket);

            await queryRunner.commitTransaction();

            return {
                ticket: savedTicket,
                remainingBalance: player.balance
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

}
