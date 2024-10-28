import {CardService} from "./card-service";
import {PurchaseService} from "./purchase-service";
import {PackService} from "./pack-service";
import {PlayerService} from "./player-service";
import {BattleService} from "./battle-service";
import {LobbyService} from "./loby-service";

import { io } from '../app';
import {CryptoServiceService} from "./crypto-service";


export class RootService {
    public readonly cardService = new CardService();
    public readonly purchaseService = new PurchaseService();
    public readonly packService = new PackService();
    public readonly playerService = new PlayerService();
    public readonly cryptoService = new CryptoServiceService();
    public readonly battleService: BattleService;
    public readonly lobbyService: LobbyService;

    private constructor() {
        this.battleService = new BattleService(io);
        this.lobbyService = new LobbyService(io);
    }


    public static readonly I = new RootService();
}