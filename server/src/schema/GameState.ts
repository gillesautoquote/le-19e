import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('float32') x: number = 0;
  @type('float32') z: number = 0;
  @type('float32') rotation: number = 0;
  @type('uint8') anim: number = 0; // 0=idle, 1=walk
  @type('string') epoch: string = 'A'; // 'A' | 'B'
  @type('int64') lastUpdate: number = 0;
}

export class WorldState extends Schema {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>();

  @type('uint16')
  playerCount: number = 0;
}
