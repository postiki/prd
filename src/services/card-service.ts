import {Card, CardRarity} from "../db/models/indext";
import {db} from "../db";

export class CardService {
    async createCard(rarity?: CardRarity): Promise<Card> {
        const card = new Card();
        const finalRarity = rarity || Card.generateRandomRarity();
        card.initialize(finalRarity);

        return db.getRepository(Card).save(card);
    }

    async createPackCards(count: number = 10): Promise<Card[]> {
        const cards: Card[] = [];

        const guaranteedCard = await this.createCard(this.getGuaranteedRarity());
        cards.push(guaranteedCard);

        for (let i = 1; i < count; i++) {
            const card = await this.createCard();
            cards.push(card);
        }

        return cards;
    }

    private getGuaranteedRarity(): CardRarity {
        const random = Math.random() * 100;

        if (random < 5) return CardRarity.EPIC;
        if (random < 20) return CardRarity.RARE;
        return CardRarity.RARE;
    }
}
