import { Room, type Client } from 'colyseus';
import { WorldState } from '../schema/GameState';
interface JoinOptions {
    name?: string;
}
export declare class WorldRoom extends Room<WorldState> {
    maxClients: number;
    onCreate(): void;
    onJoin(client: Client, options: JoinOptions): void;
    onLeave(client: Client): void;
}
export {};
