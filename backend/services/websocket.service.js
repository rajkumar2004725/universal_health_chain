import { WebSocketServer } from 'ws';
import http from 'http';
import logger from '../utils/logger.js';

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
export const initWebSocketServer = (server) => {
    try {
        const wss = new WebSocketServer({ 
            server,
            path: '/ws'
        });
        
        logger.info('WebSocket server initialized');
        
        wss.on('connection', (ws) => {
            logger.info('Client connected to WebSocket');
            
            // Send initial connection message
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                timestamp: new Date().toISOString()
            }));
            
            // Handle messages from clients
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    logger.info(`Received WebSocket message: ${data.type}`);
                    
                    // Handle different message types
                    switch (data.type) {
                        case 'ping':
                            ws.send(JSON.stringify({
                                type: 'pong',
                                timestamp: new Date().toISOString()
                            }));
                            break;
                        case 'subscribe':
                            // Handle subscription to events
                            ws.send(JSON.stringify({
                                type: 'subscription',
                                status: 'success',
                                channel: data.channel,
                                timestamp: new Date().toISOString()
                            }));
                            break;
                        default:
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: 'Unknown message type',
                                timestamp: new Date().toISOString()
                            }));
                    }
                } catch (error) {
                    logger.error('Error processing WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                        timestamp: new Date().toISOString()
                    }));
                }
            });
            
            // Handle disconnection
            ws.on('close', () => {
                logger.info('Client disconnected from WebSocket');
            });
            
            // Handle errors
            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
            });
        });
        
        // Broadcast function for sending messages to all clients
        wss.broadcast = (data) => {
            wss.clients.forEach((client) => {
                if (client.readyState === 1) { // 1 = OPEN
                    client.send(JSON.stringify(data));
                }
            });
        };
        
        // Return the WebSocket server instance
        return wss;
    } catch (error) {
        logger.error('Failed to initialize WebSocket server:', error);
        throw error;
    }
};

export default { initWebSocketServer };
