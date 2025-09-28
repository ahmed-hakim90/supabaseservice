import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth';

interface UseWebSocketOptions {
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    // Create socket connection
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? window.location.origin  // Use same origin (vite proxy will handle routing)
      : window.location.origin;
    
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      
      // Join user-specific rooms
      if (user.centerId) {
        socket.emit('join-center', user.centerId);
      }
      socket.emit('join-role', user.role);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
    });

    // Service Request Events
    socket.on('service-request-created', (data) => {
      console.log('📡 Service request created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('service-request-updated', (data) => {
      console.log('📡 Service request updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('service-request-deleted', (data) => {
      console.log('📡 Service request deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('service-request-assigned', (data) => {
      console.log('📡 Service request assigned:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('service-request-follow-up', (data) => {
      console.log('📡 Service request follow-up:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      queryClient.invalidateQueries({ queryKey: [`/api/service-requests/${data.serviceRequest.id}/follow-ups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // User Events
    socket.on('user-created', (data) => {
      console.log('📡 User created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('user-updated', (data) => {
      console.log('📡 User updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('user-deleted', (data) => {
      console.log('📡 User deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('user-status-changed', (data) => {
      console.log('📡 User status changed:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Customer Events
    socket.on('customer-created', (data) => {
      console.log('📡 Customer created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('customer-updated', (data) => {
      console.log('📡 Customer updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('customer-deleted', (data) => {
      console.log('📡 Customer deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Service Center Events
    socket.on('center-created', (data) => {
      console.log('📡 Service center created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('center-updated', (data) => {
      console.log('📡 Service center updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('center-deleted', (data) => {
      console.log('📡 Service center deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Product Events
    socket.on('product-created', (data) => {
      console.log('📡 Product created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('product-updated', (data) => {
      console.log('📡 Product updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('product-deleted', (data) => {
      console.log('📡 Product deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Warehouse Events
    socket.on('warehouse-created', (data) => {
      console.log('📡 Warehouse created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('warehouse-updated', (data) => {
      console.log('📡 Warehouse updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('warehouse-deleted', (data) => {
      console.log('📡 Warehouse deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Inventory Events
    socket.on('inventory-updated', (data) => {
      console.log('📡 Inventory updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Transfer Events
    socket.on('transfer-created', (data) => {
      console.log('📡 Transfer created:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('transfer-updated', (data) => {
      console.log('📡 Transfer updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    socket.on('transfer-approved', (data) => {
      console.log('📡 Transfer approved:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    });

    // Activity Events
    socket.on('activity-logged', (data) => {
      console.log('📡 Activity logged:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    });

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socket.disconnect();
    };
  }, [enabled, user, queryClient]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
}