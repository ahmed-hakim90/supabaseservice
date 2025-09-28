import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export function initializeWebSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user to their center room for center-specific updates
    socket.on('join-center', (centerId: string) => {
      if (centerId) {
        socket.join(`center-${centerId}`);
        console.log(`👥 User ${socket.id} joined center room: center-${centerId}`);
      }
    });

    // Join user to their role room for role-specific updates
    socket.on('join-role', (role: string) => {
      if (role) {
        socket.join(`role-${role}`);
        console.log(`👤 User ${socket.id} joined role room: role-${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getWebSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

// Real-time event types
export type RealTimeEvent = 
  | 'service-request-created'
  | 'service-request-updated'
  | 'service-request-deleted'
  | 'service-request-assigned'
  | 'service-request-follow-up'
  | 'follow-up-updated'
  | 'user-created'
  | 'user-updated'
  | 'user-deleted'
  | 'user-status-changed'
  | 'customer-created'
  | 'customer-updated'
  | 'customer-deleted'
  | 'center-created'
  | 'center-updated'
  | 'center-deleted'
  | 'product-created'
  | 'product-updated'
  | 'product-deleted'
  | 'warehouse-created'
  | 'warehouse-updated'
  | 'warehouse-deleted'
  | 'inventory-updated'
  | 'transfer-created'
  | 'transfer-updated'
  | 'transfer-approved'
  | 'transfer-completed'
  | 'activity-logged';

// Broadcast to all connected clients
export function broadcastToAll(event: RealTimeEvent, data: any) {
  if (io) {
    io.emit(event, data);
    console.log(`📡 Broadcast to all: ${event}`, data);
  }
}

// Broadcast to specific center
export function broadcastToCenter(centerId: string, event: RealTimeEvent, data: any) {
  if (io) {
    io.to(`center-${centerId}`).emit(event, data);
    console.log(`📡 Broadcast to center ${centerId}: ${event}`, data);
  }
}

// Broadcast to specific role
export function broadcastToRole(role: string, event: RealTimeEvent, data: any) {
  if (io) {
    io.to(`role-${role}`).emit(event, data);
    console.log(`📡 Broadcast to role ${role}: ${event}`, data);
  }
}

// Broadcast to multiple targets
export function broadcastEvent(
  event: RealTimeEvent, 
  data: any, 
  options: {
    toAll?: boolean;
    toCenters?: string[];
    toRoles?: string[];
  } = {}
) {
  if (!io) return;

  if (options.toAll) {
    broadcastToAll(event, data);
  }

  if (options.toCenters) {
    options.toCenters.forEach(centerId => {
      broadcastToCenter(centerId, event, data);
    });
  }

  if (options.toRoles) {
    options.toRoles.forEach(role => {
      broadcastToRole(role, event, data);
    });
  }
}