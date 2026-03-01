import { Schema, MapSchema } from '@colyseus/schema';
export declare class PlayerState extends Schema {
    id: string;
    name: string;
    x: number;
    z: number;
    rotation: number;
    anim: number;
    epoch: string;
    lastUpdate: number;
}
export declare class WorldState extends Schema {
    players: MapSchema<PlayerState, string>;
    playerCount: number;
}
