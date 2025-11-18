// src/lib/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getStoredAuthToken } from '../utils/auth.utils';
import { API_BASE_URL } from '../api/config';

interface UseWebSocketOptions {
  onNotification?: (notification: any) => void;
  onMessage?: (message: any) => void;
  onConversationUpdate?: (conversation: any) => void;
}

// Singleton pattern to maintain a single WebSocket connection across components
let globalSocket: Socket | null = null;
let connectionCount = 0;

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<UseWebSocketOptions>({});

  // Store callbacks in ref so they don't trigger re-renders
  useEffect(() => {
    callbacksRef.current = {
      onNotification: options.onNotification,
      onMessage: options.onMessage,
      onConversationUpdate: options.onConversationUpdate,
    };
  }, [options.onNotification, options.onMessage, options.onConversationUpdate]);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      console.warn('WebSocket: No auth token found, skipping connection');
      return;
    }

    // If socket already exists, just add listeners
    if (globalSocket) {
      console.log('WebSocket: Reusing existing connection');
      setIsConnected(globalSocket.connected);
      
      // Add event listeners
      const handleNotification = (notification: any) => {
        callbacksRef.current.onNotification?.(notification);
      };
      const handleMessage = (message: any) => {
        callbacksRef.current.onMessage?.(message);
      };
      const handleConversationUpdate = (conversation: any) => {
        callbacksRef.current.onConversationUpdate?.(conversation);
      };

      globalSocket.on('notification', handleNotification);
      globalSocket.on('message', handleMessage);
      globalSocket.on('conversation_update', handleConversationUpdate);

      connectionCount++;

      return () => {
        connectionCount--;
        if (globalSocket) {
          globalSocket.off('notification', handleNotification);
          globalSocket.off('message', handleMessage);
          globalSocket.off('conversation_update', handleConversationUpdate);
          
          // Only disconnect if no components are using it
          if (connectionCount === 0) {
            console.log('WebSocket: Disconnecting (no active connections)');
            globalSocket.disconnect();
            globalSocket = null;
          }
        }
      };
    }

    // Create new socket connection if it doesn't exist
    if (!globalSocket) {
      // Ensure proper URL conversion for WebSocket
      let wsUrl = API_BASE_URL;
      if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      } else if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        // If no protocol, assume wss for production
        wsUrl = `wss://${wsUrl}`;
      }
      
      console.log('WebSocket: Creating new connection to', wsUrl);
      globalSocket = io(wsUrl, {
        auth: {
          token,
        },
        query: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        timeout: 20000,
      });

      globalSocket.on('connect', () => {
        console.log('WebSocket: Connected successfully');
        setIsConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('WebSocket: Disconnected', reason);
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('WebSocket: Connection error', error.message);
        setIsConnected(false);
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket: Reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      globalSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('WebSocket: Reconnection attempt', attemptNumber);
      });

      globalSocket.on('reconnect_error', (error) => {
        console.error('WebSocket: Reconnection error', error.message);
      });

      globalSocket.on('reconnect_failed', () => {
        console.error('WebSocket: Reconnection failed');
      });
    }

    connectionCount++;

    // Add event listeners
    const handleNotification = (notification: any) => {
      callbacksRef.current.onNotification?.(notification);
    };
    const handleMessage = (message: any) => {
      callbacksRef.current.onMessage?.(message);
    };
    const handleConversationUpdate = (conversation: any) => {
      callbacksRef.current.onConversationUpdate?.(conversation);
    };

    globalSocket.on('notification', handleNotification);
    globalSocket.on('message', handleMessage);
    globalSocket.on('conversation_update', handleConversationUpdate);

    return () => {
      connectionCount--;
      if (globalSocket) {
        globalSocket.off('notification', handleNotification);
        globalSocket.off('message', handleMessage);
        globalSocket.off('conversation_update', handleConversationUpdate);
        
        // Only disconnect if no components are using it
        if (connectionCount === 0) {
          console.log('WebSocket: Disconnecting (no active connections)');
          globalSocket.disconnect();
          globalSocket = null;
        }
      }
    };
  }, []); // Empty dependency array - only run once

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      connectionCount = 0;
      setIsConnected(false);
    }
  }, []);

  return { isConnected, disconnect };
};

