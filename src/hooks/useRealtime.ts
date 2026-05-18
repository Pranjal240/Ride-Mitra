import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from './useStore';
import type { Notification, Message } from '../types';

export function useRealtimeNotifications(userId: string | undefined) {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user:${userId}:notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification]);
}

export function useRealtimeLocation(rideId: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number; speed: number } | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`ride:${rideId}:location`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const loc = payload.new as any;
          if (loc?.location) {
            setLocation({
              lat: loc.location.lat,
              lng: loc.location.lng,
              speed: loc.speed || 0,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return location;
}

export function useRealtimeMessages(rideId: string) {
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`ride:${rideId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          setLastMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return lastMessage;
}
