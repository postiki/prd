import {Server, Socket} from "socket.io";
import {RootService} from "./index";
import {BattleService} from "./battle-service";

interface QueuedPlayer {
    socket: Socket;
    walletAddress: string;
    rating?: number;
    queuedAt: Date;
}

export class LobbyService {
    private io: Server;
    private playerQueue: QueuedPlayer[] = [];
    private activeBattles: Map<string, Set<string>> = new Map();

    constructor(io: Server) {
        this.io = io;
        this.initializeSocketHandlers();
        this.startMatchmaking();
    }

    private async startBattle(player1: QueuedPlayer, player2: QueuedPlayer) {
        try {
            // Use BattleService from RootService
            const battleId = await RootService.I.battleService.createBattle(
                player1.walletAddress,
                player2.walletAddress
            );

            //TODO decrement user balance for enter

            this.activeBattles.set(battleId, new Set([player1.walletAddress, player2.walletAddress]));

            [player1, player2].forEach(player => {
                player.socket.emit('battleFound', {
                    battleId,
                    opponent: player === player1 ? player2.walletAddress : player1.walletAddress
                });
            });

        } catch (error) {
            this.playerQueue.unshift(player1, player2);
            [player1, player2].forEach(player => {
                player.socket.emit('error', { message: 'Failed to create battle' });
            });
        }
    }

    private initializeSocketHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('New connection:', socket.id);

            socket.on('joinQueue', (data: { walletAddress: string }) =>
                this.handleJoinQueue(socket, data));

            socket.on('leaveQueue', (data: { walletAddress: string }) =>
                this.handleLeaveQueue(socket, data));

            socket.on('disconnect', () =>
                this.handleDisconnect(socket));
        });
    }

    private async handleJoinQueue(socket: Socket, data: { walletAddress: string }) {
        const { walletAddress } = data;

        // Check if player is already in queue
        if (this.playerQueue.some(p => p.walletAddress === walletAddress)) {
            socket.emit('error', { message: 'Already in queue' });
            return;
        }

        // Check if player is already in battle
        for (const [_, players] of this.activeBattles) {
            if (players.has(walletAddress)) {
                socket.emit('error', { message: 'Already in battle' });
                return;
            }
        }

        this.playerQueue.push({
            socket,
            walletAddress,
            queuedAt: new Date()
        });

        socket.emit('queueJoined', {
            message: 'Successfully joined queue',
            queuePosition: this.playerQueue.length
        });
    }

    private handleLeaveQueue(socket: Socket, data: { walletAddress: string }) {
        const index = this.playerQueue.findIndex(p => p.walletAddress === data.walletAddress);
        if (index !== -1) {
            this.playerQueue.splice(index, 1);
            socket.emit('queueLeft', { message: 'Left queue successfully' });
        }
    }

    private handleDisconnect(socket: Socket) {
        const index = this.playerQueue.findIndex(p => p.socket.id === socket.id);
        if (index !== -1) {
            this.playerQueue.splice(index, 1);
        }
    }

    private startMatchmaking() {
        setInterval(() => {
            while (this.playerQueue.length >= 2) {
                const player1 = this.playerQueue.shift()!;
                const player2 = this.playerQueue.shift()!;

                this.startBattle(player1, player2);
            }
        }, 5000);
    }
}


