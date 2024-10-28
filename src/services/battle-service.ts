import {Server, Socket} from "socket.io";
import {Battle, BattleStatus, Card, Player} from "../db/models/indext";
import {db} from "../db";

export class BattleService {
    private io: Server;
    private activeBattles: Map<string, {
        sockets: Map<string, Socket>;
        currentTurn: string;
        player1: string;
        player2: string;
        turnCount: number;
        player1Cards: Card[];
        player2Cards: Card[];
        lanePlayer1:{
            1: any[],
            2: any[],
            3: any[],
        },
        lanePlayer2:{
            1: any[],
            2: any[],
            3: any[],
        }
    }> = new Map();

    constructor(io: Server) {
        this.io = io;
        this.initializeBattleHandlers();
    }

    private initializeBattleHandlers() {
        this.io.on('connection', (socket: Socket) => {
            socket.on('joinBattle', (data: { battleId: string, walletAddress: string }) =>
                this.handleJoinBattle(socket, data));

            socket.on('placeCard', (data: {
                battleId: string,
                walletAddress: string,
                cardId: string,
                laneNumber: number
            }) => this.handlePlaceCard(socket, data));

            socket.on('attackCard', (data: {
                battleId: string,
                walletAddress: string,
                targetCardId: string,
                fromLane: number,
                toLane: number
            }) => this.handleAttack(socket, data));

            socket.on('moveCard', (data: {
                battleId: string,
                walletAddress: string,
                attackingCardId: string,
                targetCardId: string,
                fromLane: number,
                toLane: number
            }) => this.handleMoveCard(socket, data));

            socket.on('endTurn', (data: {
                battleId: string,
                walletAddress: string
            }) => this.handleEndTurn(socket, data));
        });
    }

    async createBattle(player1WalletAddress: string, player2WalletAddress: string): Promise<string> {
        const battle = new Battle();
        battle.player1 = await db.getRepository(Player).findOne({ where: { walletAddress: player1WalletAddress }});
        battle.player2 = await db.getRepository(Player).findOne({ where: { walletAddress: player2WalletAddress }});
        battle.status = BattleStatus.PENDING;

        const savedBattle = await db.getRepository(Battle).save(battle);
        return savedBattle.id;
    }

    private notifyPlayerTurn(battleId: string) {
        const battleState = this.activeBattles.get(battleId);
        if (!battleState) return;

        this.io.to(battleId).emit('turnUpdate', {
            currentTurn: battleState.currentTurn,
            turnCount: battleState.turnCount
        });
    }

    private async handleJoinBattle(socket: Socket, data: { battleId: string, walletAddress: string }) {
        const { battleId, walletAddress } = data;

        const battle = await db.getRepository(Battle).findOne({
            where: { id: battleId },
            relations: ['player1', 'player2']
        });

        if (!battle) {
            socket.emit('error', { message: 'Battle not found' });
            return;
        }

        if (!this.activeBattles.has(battleId)) {
            this.activeBattles.set(battleId, {
                ...this.activeBattles,
                sockets: new Map(),
                currentTurn: battle.player1.walletAddress,
                player1: battle.player1.walletAddress,
                player2: battle.player2.walletAddress,
                turnCount: 0,
                player1Cards:[],
                player2Cards: [], //TODO correct adding cards from hand, and their postions
            });
        }

        const battleState = this.activeBattles.get(battleId)!;
        battleState.sockets.set(walletAddress, socket);

        socket.join(battleId);

        if (battleState.sockets.size === 2) {
            this.io.to(battleId).emit('battleStart', {
                message: 'Battle starting',
                firstTurn: battleState.currentTurn
            });

            this.notifyPlayerTurn(battleId);
        }
    }

    private async handleMoveCard(socket: Socket, data: {
        battleId: string,
        walletAddress: string,
        attackingCardId: string,
        targetCardId: string,
        fromLane: number,
        toLane: number
    }) {

    }

    private async handlePlaceCard(socket: Socket, data: {
        battleId: string,
        walletAddress: string,
        cardId: string,
        laneNumber: number
    }) {

        this.io.to(data.battleId).emit('cardPlaced', {
            laneNumber: data.laneNumber,
            player: isPlayer1 ? 'player1' : 'player2',
            card: {
                id: card.id,
                currentPower: card.power,
                initialPower: card.power
            }
        });
    }

    private async handleAttack(socket: Socket, data: {
        battleId: string,
        walletAddress: string,
        attackingCardId: string,
        targetCardId: string,
        fromLane: number,
        toLane: number
    }) {
        // Emit attack result
        this.io.to(data.battleId).emit('attackResult', {
            fromLane: data.fromLane,
            toLane: data.toLane,
            attackingCard: {
                id: attackingCard.cardId,
                currentPower: attackingCard.currentPower
            },
            targetCard: {
                id: targetCard.cardId,
                currentPower: targetCard.currentPower
            },
            damage
        });

        // Check if card is defeated
        if (targetCard.currentPower <= 0) {

            this.io.to(data.battleId).emit('cardDefeated', {
                laneNumber: data.toLane,
                cardId: targetCard.cardId
            });

            // Check for win condition
            if (this.checkWinCondition(battleState)) {
                const winner = isAttackerPlayer1 ? battleState.player1 : battleState.player2;
                this.handleBattleEnd(data.battleId, winner);
            }
        }
    }

    private async handleEndTurn(socket: Socket, data: {
        battleId: string,
        walletAddress: string
    }) {
        const battleState = this.activeBattles.get(data.battleId);
        if (!battleState) return;

        if (battleState.currentTurn !== data.walletAddress) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        // Switch turns
        battleState.currentTurn =
            battleState.currentTurn === battleState.player1 ?
                battleState.player2 :
                battleState.player1;

        battleState.turnCount++;

        //TODO here we need to check reduced power of cards on hande, or check them viability

        this.notifyPlayerTurn(data.battleId);
    }

    private async handleBattleEnd(battleId: string, winner: string) {
        const battleState = this.activeBattles.get(battleId);
        if (!battleState) return;

        // Update battle status in database
        await db.getRepository(Battle).update(
            { id: battleId },
            {
                status: BattleStatus.COMPLETED,
                winnerId: winner
            }
        );

        // Notify players
        this.io.to(battleId).emit('battleEnd', {
            winner,
            finalState: {
                lanePlayer1: battleState.lanePlayer1,
                lanePlayer2: battleState.lanePlayer2
            }
        });

        // Cleanup
        this.activeBattles.delete(battleId);
    }

    private checkWinCondition(battleState: any): boolean {
        // Check if all lanes of one player are empty
        const player1HasCards = Object.values(battleState.lanePlayer1).some(lane => lane.length > 0);
        const player2HasCards = Object.values(battleState.lanePlayer2).some(lane => lane.length > 0);

        return !player1HasCards || !player2HasCards;
    }
}
