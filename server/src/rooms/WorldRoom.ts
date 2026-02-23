import { Room, type Client } from 'colyseus';
import { WorldState, PlayerState } from '../schema/GameState';
import { validateMovement, rateLimitOk, rateLimitCleanup, sanitize } from '../validation/movement';

const NAME_MAX_LENGTH = 20;
const CHAT_MAX_LENGTH = 200;

interface JoinOptions {
  name?: string;
}

interface PositionMessage {
  x: number;
  z: number;
  rotation: number;
  anim: number;
}

interface ChatMessage {
  text: string;
  channel: 'global' | 'proximity';
}

interface EpochMessage {
  epoch: 'A' | 'B';
}

export class WorldRoom extends Room<WorldState> {
  maxClients = 200;

  onCreate(): void {
    this.setState(new WorldState());

    this.onMessage('position', (client: Client, data: PositionMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (!validateMovement(player, data)) return;

      player.x = data.x;
      player.z = data.z;
      player.rotation = data.rotation;
      player.anim = data.anim;
      player.lastUpdate = Date.now();

      // Relay position to all other clients
      this.broadcast('player_move', {
        id: client.sessionId,
        x: data.x,
        z: data.z,
        rotation: data.rotation,
        anim: data.anim,
      }, { except: client });
    });

    this.onMessage('chat', (client: Client, data: ChatMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (!rateLimitOk(client.sessionId)) return;
      if (!data.text || typeof data.text !== 'string') return;

      const text = sanitize(data.text).slice(0, CHAT_MAX_LENGTH);
      const channel = data.channel === 'proximity' ? 'proximity' : 'global';

      this.broadcast('chat', {
        playerId: client.sessionId,
        name: player.name,
        text,
        channel,
        x: player.x,
        z: player.z,
        ts: Date.now(),
      });
    });

    this.onMessage('epoch', (client: Client, data: EpochMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (data.epoch === 'A' || data.epoch === 'B') {
        player.epoch = data.epoch;
        this.broadcast('player_epoch', {
          id: client.sessionId,
          epoch: data.epoch,
        }, { except: client });
      }
    });
  }

  onJoin(client: Client, options: JoinOptions): void {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = sanitize(options.name || 'Flâneur').slice(0, NAME_MAX_LENGTH);
    player.epoch = 'A';
    player.lastUpdate = Date.now();

    this.state.players.set(client.sessionId, player);
    this.state.playerCount = this.state.players.size;

    // Send existing players to the new client
    this.state.players.forEach((p: PlayerState, key: string) => {
      if (key !== client.sessionId) {
        client.send('player_add', {
          id: key,
          name: p.name,
          x: p.x,
          z: p.z,
          rotation: p.rotation,
          anim: p.anim,
          epoch: p.epoch,
        });
      }
    });

    // Tell everyone about the new player
    this.broadcast('player_add', {
      id: client.sessionId,
      name: player.name,
      x: player.x,
      z: player.z,
      rotation: player.rotation,
      anim: player.anim,
      epoch: player.epoch,
    }, { except: client });

    // Broadcast updated count to all
    this.broadcast('player_count', { count: this.state.playerCount });

    this.broadcast('system', {
      type: 'join',
      playerId: client.sessionId,
      name: player.name,
      ts: Date.now(),
    });
  }

  onLeave(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    const name = player?.name || 'Inconnu';

    this.state.players.delete(client.sessionId);
    this.state.playerCount = this.state.players.size;
    rateLimitCleanup(client.sessionId);

    // Tell everyone this player left
    this.broadcast('player_remove', { id: client.sessionId });
    this.broadcast('player_count', { count: this.state.playerCount });

    this.broadcast('system', {
      type: 'leave',
      playerId: client.sessionId,
      name,
      ts: Date.now(),
    });
  }
}
