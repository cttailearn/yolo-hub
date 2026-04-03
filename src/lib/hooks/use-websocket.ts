'use client';

import * as React from 'react';
import { config } from '@/lib/config';
import type { WSMessage } from '@/types';

interface UseWebSocketOptions {
  onMetrics?: (data: any) => void;
  onStatus?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useWebSocket(taskId: string, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = React.useState(false);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = React.useRef(0);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const connect = React.useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${config.websocket.url}/ws/${taskId}`);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      options.onConnected?.();
    };

    ws.onclose = () => {
      setIsConnected(false);
      options.onDisconnected?.();

      // 自动重连
      if (reconnectAttemptsRef.current < config.websocket.maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, config.websocket.reconnectInterval);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'metrics':
            options.onMetrics?.(message.data);
            break;
          case 'status':
            options.onStatus?.(message.data);
            break;
          case 'connected':
            console.log('WebSocket connected:', message);
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [taskId, options]);

  const disconnect = React.useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect: connect,
  };
}
