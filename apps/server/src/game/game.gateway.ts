import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private playerLocations = new Map<string, { lat: number; lng: number }>();

  handleConnection(client: Socket) {
    console.log(`Game client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.playerLocations.delete(client.id);
    console.log(`Game client disconnected: ${client.id}`);
  }

  @SubscribeMessage('player:move')
  handlePlayerMove(
    client: Socket,
    payload: { lat: number; lng: number; huntId?: string },
  ) {
    this.playerLocations.set(client.id, payload);

    if (payload.huntId) {
      this.server.to(`hunt:${payload.huntId}`).emit('player:moved', {
        playerId: client.id,
        lat: payload.lat,
        lng: payload.lng,
      });
    }
  }

  @SubscribeMessage('hunt:join-room')
  handleJoinHuntRoom(client: Socket, huntId: string) {
    client.join(`hunt:${huntId}`);
    client.emit('hunt:joined-room', { huntId });
  }

  @SubscribeMessage('hunt:leave-room')
  handleLeaveHuntRoom(client: Socket, huntId: string) {
    client.leave(`hunt:${huntId}`);
  }

  broadcastClueUnlocked(huntId: string, playerId: string, clueSequence: number) {
    this.server.to(`hunt:${huntId}`).emit('clue:unlocked', {
      playerId,
      clueSequence,
    });
  }

  broadcastTreasureClaimed(huntId: string, winnerId: string, reward: string) {
    this.server.to(`hunt:${huntId}`).emit('treasure:claimed', {
      winnerId,
      reward,
    });
  }

  broadcastLeaderboardUpdate(data: any) {
    this.server.emit('leaderboard:updated', data);
  }

  getPlayerLocation(playerId: string) {
    return this.playerLocations.get(playerId);
  }
}
