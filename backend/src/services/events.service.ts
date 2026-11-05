import { v4 as uuidv4 } from 'uuid';
import { DataStore } from '../database/store';
import { EventItem, EventStatus, EventBooking, BookingStatus, GeoLocation } from '../shared/types';

export class EventsService {
  /**
   * Computes the great-circle distance between two GPS points using the Haversine formula (in Kilometers)
   */
  public static calculateDistanceKm(loc1: GeoLocation, loc2: GeoLocation): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Creates a new event published by an Organization
   */
  public static createEvent(orgId: string, eventData: Omit<EventItem, 'id' | 'orgId' | 'bookedSeats' | 'status'>): EventItem {
    const orgProfile = DataStore.profiles.get(orgId);
    const newEvent: EventItem = {
      ...eventData,
      id: `event-${uuidv4().substring(0, 8)}`,
      orgId,
      orgName: orgProfile?.fullName || 'Event Host Organization',
      bookedSeats: 0,
      status: EventStatus.PUBLISHED
    };

    DataStore.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  /**
   * Retrieves events sorted by proximity to the user's GPS coordinates
   */
  public static getNearbyEvents(userLat?: number, userLng?: number, radiusKm: number = 50): EventItem[] {
    const allEvents = Array.from(DataStore.events.values()).filter(
      e => e.status === EventStatus.PUBLISHED
    );

    if (userLat === undefined || userLng === undefined) {
      return allEvents;
    }

    const userLoc: GeoLocation = { latitude: userLat, longitude: userLng };

    return allEvents
      .map(event => {
        const distance = this.calculateDistanceKm(userLoc, event.location);
        return {
          ...event,
          distanceKm: distance
        };
      })
      .filter(event => event.distanceKm! <= radiusKm)
      .sort((a, b) => a.distanceKm! - b.distanceKm!);
  }

  /**
   * Books tickets for an event
   */
  public static bookEvent(eventId: string, userId: string, numberOfTickets: number = 1): EventBooking {
    const event = DataStore.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.bookedSeats + numberOfTickets > event.totalCapacity) {
      throw new Error(`Sold out! Only ${event.totalCapacity - event.bookedSeats} seats remaining.`);
    }

    event.bookedSeats += numberOfTickets;

    const booking: EventBooking = {
      id: `booking-${uuidv4().substring(0, 8)}`,
      eventId,
      userId,
      bookingCode: `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      numberOfTickets,
      totalAmount: event.ticketPrice * numberOfTickets,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date().toISOString()
    };

    DataStore.bookings.set(booking.id, booking);
    return booking;
  }

  /**
   * Gets all bookings made by a user
   */
  public static getUserBookings(userId: string): EventBooking[] {
    return Array.from(DataStore.bookings.values()).filter(b => b.userId === userId);
  }
}
