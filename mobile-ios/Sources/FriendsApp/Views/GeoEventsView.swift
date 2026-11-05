import SwiftUI

public struct GeoEventsView: View {
    @State private var events = [
        EventItem(
            id: "event-001",
            orgId: "org-001",
            orgName: "RedBull Events & Productions",
            title: "Neon Nights: Electronic Music Fest 2026",
            description: "Experience 12 hours of non-stop electronic synthwave, food trucks, and light installations.",
            category: "Music & Concerts",
            location: GeoLocation(latitude: 37.7749, longitude: -122.4194),
            venueName: "The Midway SF",
            address: "900 Marin St, San Francisco, CA",
            startTime: "Sat, 8:00 PM",
            endTime: "Sun, 4:00 AM",
            totalCapacity: 500,
            bookedSeats: 142,
            ticketPrice: 35.0,
            distanceKm: 1.4
        ),
        EventItem(
            id: "event-002",
            orgId: "org-001",
            orgName: "Bay Area Founders Club",
            title: "Tech & Friends Networking Mixer",
            description: "Casual networking evening for founders, mobile developers, and creators with complimentary drinks.",
            category: "Networking",
            location: GeoLocation(latitude: 37.7833, longitude: -122.4167),
            venueName: "Salesforce Park Rooftop",
            address: "425 Mission St, San Francisco, CA",
            startTime: "Tomorrow, 6:30 PM",
            endTime: "Tomorrow, 9:30 PM",
            totalCapacity: 150,
            bookedSeats: 89,
            ticketPrice: 0.0,
            distanceKm: 2.8
        )
    ]
    
    @State private var selectedEvent: EventItem? = nil
    @State private var bookingConfirmed = false
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 16) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill")
                            .foregroundColor(Color(red: 0.42, green: 0.36, blue: 0.91))
                            .font(.caption)
                        Text("Events Near You")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Text("San Francisco, CA")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                .padding(.horizontal)
                .padding(.top)
                
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(events) { event in
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text(event.category)
                                        .font(.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(Color(red: 0.42, green: 0.36, blue: 0.91))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(red: 0.42, green: 0.36, blue: 0.91).opacity(0.15))
                                        .cornerRadius(8)
                                    
                                    Spacer()
                                    
                                    if let dist = event.distanceKm {
                                        Text("\(String(format: "%.1f", dist)) km away")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.cyan)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.cyan.opacity(0.15))
                                            .cornerRadius(8)
                                    }
                                }
                                
                                Text(event.title)
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                Text(event.description)
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .lineLimit(2)
                                
                                HStack {
                                    Image(systemName: "mappin.and.ellipse")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Text(event.venueName)
                                        .font(.caption)
                                        .foregroundColor(.white)
                                }
                                
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(event.ticketPrice == 0 ? "FREE" : "$\(String(format: "%.2f", event.ticketPrice))")
                                            .font(.title3)
                                            .fontWeight(.heavy)
                                            .foregroundColor(event.ticketPrice == 0 ? .cyan : .white)
                                        
                                        Text("\(event.totalCapacity - event.bookedSeats) seats remaining")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                    
                                    Button(action: {
                                        selectedEvent = event
                                        bookingConfirmed = false
                                    }) {
                                        Text("Book Ticket")
                                            .fontWeight(.bold)
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 8)
                                            .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                                            .foregroundColor(.white)
                                            .cornerRadius(10)
                                    }
                                }
                            }
                            .padding()
                            .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                            .cornerRadius(16)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .sheet(item: $selectedEvent) { event in
            ZStack {
                Color(red: 0.12, green: 0.16, blue: 0.23).ignoresSafeArea()
                
                VStack(spacing: 20) {
                    if !bookingConfirmed {
                        Text("Confirm Ticket Booking")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text(event.title)
                            .foregroundColor(Color(red: 0.42, green: 0.36, blue: 0.91))
                        
                        Button(action: { bookingConfirmed = true }) {
                            Text("Confirm Booking & Issue QR Pass")
                                .fontWeight(.bold)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    } else {
                        VStack(spacing: 12) {
                            Text("🎉 Booking Confirmed!")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.cyan)
                            Text("Pass Code: PASS-IOS-993")
                                .foregroundColor(.white)
                            Button("Done") {
                                selectedEvent = nil
                            }
                            .padding()
                        }
                    }
                }
                .padding()
            }
        }
    }
}
