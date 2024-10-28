import {Card, Pack} from "../db/models/indext";
import {db} from "../db";
import {RootService} from "./index";

export class PackService {
    constructor() {

    }
    async openPack(packId: string, walletAddress: string): Promise<Card[]> {
        const pack = await db.getRepository(Pack).findOne({
            where: {id: packId},
            relations: {owner: true}
        });

        if (!pack) {
            throw new Error('Pack not found');
        }

        if (pack.owner.walletAddress !== walletAddress) {
            throw new Error('Pack belongs to another player');
        }

        if (pack.isOpened) {
            throw new Error('Pack already opened');
        }

        const newCards =await RootService.I.cardService.createPackCards()

        for (const card of newCards) {
            card.owner = pack.owner;
        }

        const savedCards = await db.getRepository(Card).save(newCards);

        pack.isOpened = true;
        pack.cardIds = savedCards.map(card => card.id);
        await db.getRepository(Pack).save(pack);

        return savedCards;

    }
}
