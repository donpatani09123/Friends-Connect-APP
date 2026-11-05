import Foundation

public enum UserRole: String, Codable, CaseIterable {
    case normal = "NORMAL"
    case celebrity = "CELEBRITY"
    case organization = "ORGANIZATION"
    case support = "SUPPORT"
    case superadmin = "SUPERADMIN"
}

public enum AccountTier: String, Codable {
    case free = "FREE"
    case premiumVip = "PREMIUM_VIP"
}

public enum CallMode: String, Codable {
    case audio = "AUDIO"
    case video = "VIDEO"
}

public enum CallType: String, Codable {
    case randomAudio = "RANDOM_AUDIO"
    case randomVideo = "RANDOM_VIDEO"
    case celebAudio = "CELEB_AUDIO"
    case celebVideo = "CELEB_VIDEO"
    case celebRandomFanVideo = "CELEB_RANDOM_FAN_VIDEO"
    case supportCall = "SUPPORT_CALL"
}

public struct User: Codable, Identifiable {
    public let id: String
    public let phoneNumber: String
    public let role: UserRole
    public var tier: AccountTier
    public let isVerified: Bool
    public let isBlocked: Bool
}

public struct GeoLocation: Codable {
    public let latitude: Double
    public let longitude: Double
    
    public init(latitude: Double, longitude: Double) {
        self.latitude = latitude
        self.longitude = longitude
    }
}

public struct EventItem: Codable, Identifiable {
    public let id: String
    public let orgId: String
    public let orgName: String?
    public let title: String
    public let description: String
    public let category: String
    public let location: GeoLocation
    public let venueName: String
    public let address: String
    public let startTime: String
    public let endTime: String
    public let totalCapacity: Int
    public var bookedSeats: Int
    public let ticketPrice: Double
    public var distanceKm: Double?
}

public struct CelebrityPost: Codable, Identifiable {
    public let id: String
    public let celebUserId: String
    public let celebName: String
    public let celebAvatar: String?
    public let mediaType: String
    public let mediaUrl: String
    public let caption: String
    public var likesCount: Int
    public var commentsCount: Int
    public let createdAt: String
}

public struct MatchFoundPayload: Codable {
    public let roomId: String
    public let mode: CallMode
    public let peerId: String
    public let peerName: String
    public let peerAvatar: String?
    public let isCelebrity: Bool?
    public let rtcToken: String
    public let role: String
}
