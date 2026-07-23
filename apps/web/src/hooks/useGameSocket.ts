'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'}/game`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Game socket connected'));
    socket.on('disconnect', () => console.log('Game socket disconnected'));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const emitLocation = useCallback((lat: number, lng: number, huntId?: string) => {
    socketRef.current?.emit('player:move', { lat, lng, huntId });
  }, []);

  const joinHuntRoom = useCallback((huntId: string) => {
    socketRef.current?.emit('hunt:join-room', huntId);
  }, []);

  const leaveHuntRoom = useCallback((huntId: string) => {
    socketRef.current?.emit('hunt:leave-room', huntId);
  }, []);

  const onClueUnlocked = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('clue:unlocked', callback);
    return () => { socketRef.current?.off('clue:unlocked', callback); };
  }, []);

  const onTreasureClaimed = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('treasure:claimed', callback);
    return () => { socketRef.current?.off('treasure:claimed', callback); };
  }, []);

  return { emitLocation, joinHuntRoom, leaveHuntRoom, onClueUnlocked, onTreasureClaimed };
}
