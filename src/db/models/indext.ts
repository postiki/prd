// src/entities/Card.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";

export enum CardRarity {
    COMMON = "COMMON",
    UNCOMMON = "UNCOMMON",
    RARE = "RARE",
    EPIC = "EPIC",
    LEGENDARY = "LEGENDARY"
}

export const CARD_RARITY_CONFIG = {
    [CardRarity.LEGENDARY]: {
        chance: 1, // 1%
        powerRange: { min: 90, max: 100 }
    },
    [CardRarity.EPIC]: {
        chance: 4, // 4%
        powerRange: { min: 70, max: 89 }
    },
    [CardRarity.RARE]: {
        chance: 10, // 10%
        powerRange: { min: 50, max: 69 }
    },
    [CardRarity.UNCOMMON]: {
        chance: 25, // 25%
        powerRange: { min: 30, max: 49 }
    },
    [CardRarity.COMMON]: {
        chance: 60, // 60%
        powerRange: { min: 10, max: 29 }
    }
} as const;


@Entity()
export class Card {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    power: number;

    @Column({
        type: "enum",
        enum: CardRarity,
        default: CardRarity.COMMON
    })
    rarity: CardRarity;

    @Column({ nullable: true })
    imageUrl: string;

    @Column("decimal")
    dropRate: number;

    @ManyToOne(() => Player, player => player.cards)
    owner: Player;

    static generateRandomRarity(): CardRarity {
        const random = Math.random() * 100;
        let cumulativeChance = 0;

        for (const [rarity, config] of Object.entries(CARD_RARITY_CONFIG)) {
            cumulativeChance += config.chance;
            if (random <= cumulativeChance) {
                return rarity as CardRarity;
            }
        }

        return CardRarity.COMMON;
    }

    static generatePower(rarity: CardRarity): number {
        const config = CARD_RARITY_CONFIG[rarity];
        return Math.floor(
            Math.random() * (config.powerRange.max - config.powerRange.min + 1)
            + config.powerRange.min
        );
    }

    initialize(rarity: CardRarity): void {
        this.rarity = rarity;
        this.power = Card.generatePower(rarity);
    }
}

// src/entities/Player.ts
@Entity()
export class Player {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    username: string;

    @Column()
    walletAddress: string;

    @Column("decimal")
    balance: number;

    @OneToMany(() => Card, card => card.owner)
    cards: Card[];

    @OneToMany(() => Pack, pack => pack.owner)
    packs: Pack[];

    @OneToMany(() => Ticket, ticket => ticket.owner)
    tickets: Ticket[];
}

// src/entities/Pack.ts
@Entity()
export class Pack {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("decimal")
    price: number;

    @Column()
    currency: string;

    @Column()
    isOpened: boolean;

    @ManyToOne(() => Player, player => player.packs)
    owner: Player;

    @Column("simple-array")
    cardIds: string[];
}

// src/entities/Ticket.ts
@Entity()
export class Ticket {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("decimal")
    price: number;

    @Column()
    currency: string;

    @Column()
    isUsed: boolean;

    @ManyToOne(() => Player, player => player.tickets)
    owner: Player;
}


export enum BattleStatus {
    PENDING = "PENDING",
    WAITING_PLAYERS = "WAITING_PLAYERS",
    SETUP_PHASE = "SETUP_PHASE",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
}

@Entity()
export class Battle {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Player)
    player1: Player;

    @ManyToOne(() => Player)
    player2: Player;

    @Column({
        type: "enum",
        enum: BattleStatus,
        default: BattleStatus.PENDING
    })
    status: BattleStatus;

    @Column("jsonb", { nullable: true })
    currentState: {
        lanes: {
            [key: number]: {
                player1Cards: Array<{
                    cardId: string;
                    currentPower: number;
                    initialPower: number;
                }>;
                player2Cards: Array<{
                    cardId: string;
                    currentPower: number;
                    initialPower: number;
                }>;
            };
        };
        currentTurn: string;
        turnNumber: number;
    };

    @Column({ nullable: true })
    winnerId: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}