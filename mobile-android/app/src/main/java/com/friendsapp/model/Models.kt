package com.friendsapp.model

enum class UserRole {
    NORMAL, CELEBRITY, ORGANIZATION, SUPPORT, SUPERADMIN
}

enum class AccountTier {
    FREE, PREMIUM_VIP
}

enum class CallMode {
    AUDIO, VIDEO
}

enum class CallType {
    RANDOM_AUDIO, RANDOM_VIDEO, CELEB_AUDIO, CELEB_VIDEO, CELEB_RANDOM_FAN_VIDEO, SUPPORT_CALL
}

data class User(
    val id: String,
    val phoneNumber: String,
    val role: UserRole,
    val tier: AccountTier,
    val isVerified: Boolean,
    val isBlocked: Boolean
)

data class UserProfile(
    val userId: String,
    val fullName: String,
    val avatarUrl: String? = null,
    val bio: String? = null,
    val callAvailable: Boolean = true,
    val randomFanConnectActive: Boolean = false
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User,
    val profile: UserProfile? = null
)

data class GeoLocation(
    val latitude: Double,
    val longitude: Double
)

data class EventItem(
    val id: String,
    val orgId: String,
    val orgName: String? = null,
    val title: String,
    val description: String,
    val category: String,
    val location: GeoLocation,
    val venueName: String,
    val address: String,
    val startTime: String,
    val endTime: String,
    val totalCapacity: Int,
    val bookedSeats: Int,
    val ticketPrice: Double,
    val coverImageUrl: String? = null,
    val distanceKm: Double? = null
)

data class EventBooking(
    val id: String,
    val eventId: String,
    val bookingCode: String,
    val numberOfTickets: Int,
    val totalAmount: Double,
    val status: String
)

data class CelebrityPost(
    val id: String,
    val celebUserId: String,
    val celebName: String,
    val celebAvatar: String? = null,
    val mediaType: String,
    val mediaUrl: String,
    val thumbnailUrl: String? = null,
    val caption: String,
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val createdAt: String
)

data class CallSession(
    val id: String,
    val callType: CallType,
    val mode: CallMode,
    val callerId: String,
    val callerName: String? = null,
    val receiverId: String? = null,
    val receiverName: String? = null,
    val roomId: String,
    val rtcToken: String? = null,
    val status: String
)

data class MatchFoundEvent(
    val roomId: String,
    val mode: CallMode,
    val peerId: String,
    val peerName: String,
    val peerAvatar: String? = null,
    val isCelebrity: Boolean = false,
    val rtcToken: String,
    val role: String
)
