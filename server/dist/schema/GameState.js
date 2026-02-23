"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldState = exports.PlayerState = void 0;
const schema_1 = require("@colyseus/schema");
class PlayerState extends schema_1.Schema {
    id = '';
    name = '';
    x = 0;
    z = 0;
    rotation = 0;
    anim = 0; // 0=idle, 1=walk
    epoch = 'A'; // 'A' | 'B'
    lastUpdate = 0;
}
exports.PlayerState = PlayerState;
__decorate([
    (0, schema_1.type)('string')
], PlayerState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)('string')
], PlayerState.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)('float32')
], PlayerState.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)('float32')
], PlayerState.prototype, "z", void 0);
__decorate([
    (0, schema_1.type)('float32')
], PlayerState.prototype, "rotation", void 0);
__decorate([
    (0, schema_1.type)('uint8')
], PlayerState.prototype, "anim", void 0);
__decorate([
    (0, schema_1.type)('string')
], PlayerState.prototype, "epoch", void 0);
__decorate([
    (0, schema_1.type)('int64')
], PlayerState.prototype, "lastUpdate", void 0);
class WorldState extends schema_1.Schema {
    players = new schema_1.MapSchema();
    playerCount = 0;
}
exports.WorldState = WorldState;
__decorate([
    (0, schema_1.type)({ map: PlayerState })
], WorldState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)('uint16')
], WorldState.prototype, "playerCount", void 0);
