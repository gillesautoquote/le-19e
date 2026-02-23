"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colyseus_1 = require("colyseus");
const ws_transport_1 = require("@colyseus/ws-transport");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const path_1 = require("path");
const WorldRoom_1 = require("./rooms/WorldRoom");
const PORT = Number(process.env.PORT) || 2567;
const app = (0, express_1.default)();
// Serve built client files
const distPath = (0, path_1.resolve)(__dirname, '../../dist');
app.use(express_1.default.static(distPath));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});
const httpServer = (0, http_1.createServer)(app);
const gameServer = new colyseus_1.Server({
    transport: new ws_transport_1.WebSocketTransport({ server: httpServer }),
});
gameServer.define('world', WorldRoom_1.WorldRoom);
httpServer.listen(PORT, () => {
    console.log(`Le 19e server listening on port ${PORT}`);
});
