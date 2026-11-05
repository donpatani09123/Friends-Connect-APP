import SwiftUI

public struct CelebrityFeedView: View {
    @Binding var userTier: AccountTier
    @State private var showPaywall = false
    @State private var callingCelebrity: String? = nil
    
    private let posts = [
        CelebrityPost(
            id: "post-001",
            celebUserId: "celeb-001",
            celebName: "Elena Rostova",
            celebAvatar: nil,
            mediaType: "IMAGE",
            mediaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000",
            caption: "Backstage vibes right before tonight’s acoustic performance! 🎸✨",
            likesCount: 12480,
            commentsCount: 432,
            createdAt: "2 hours ago"
        ),
        CelebrityPost(
            id: "post-002",
            celebUserId: "celeb-001",
            celebName: "Elena Rostova",
            celebAvatar: nil,
            mediaType: "VIDEO",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            caption: "Sneak preview of our brand new music video release! 🎥🔥",
            likesCount: 28900,
            commentsCount: 914,
            createdAt: "Yesterday"
        )
    ]
    
    public init(userTier: Binding<AccountTier>) {
        self._userTier = userTier
    }
    
    public var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(alignment: .leading, spacing: 14) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Celebrity Hub")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Text("1-on-1 VIP Video Calls & Live Fan Meetups")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Text(userTier == .premiumVip ? "VIP ACTIVE" : "FREE TIER")
                        .font(.caption2)
                        .fontWeight(.heavy)
                        .foregroundColor(userTier == .premiumVip ? .cyan : .pink)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background((userTier == .premiumVip ? Color.cyan : Color.pink).opacity(0.15))
                        .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.top)
                
                ScrollView {
                    LazyVStack(spacing: 16) {
                        // Live Fan Video Connect Banner
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Circle().fill(Color.green).frame(width: 8, height: 8)
                                Text("LIVE FAN VIDEO CONNECT")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                            Text("Elena Rostova is taking Random VIP Video Calls now!")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text("Exclusive for VIP Subscribers • 3 min per fan")
                                .font(.caption)
                                .foregroundColor(.gray)
                            
                            Button(action: {
                                if userTier == .premiumVip {
                                    callingCelebrity = "Elena Rostova (Live Fan Connect)"
                                } else {
                                    showPaywall = true
                                }
                            }) {
                                HStack {
                                    Image(systemName: "video.fill")
                                    Text("Join Live Video Pool")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(Color.cyan)
                                .foregroundColor(.black)
                                .cornerRadius(10)
                            }
                        }
                        .padding()
                        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.cyan.opacity(0.4), lineWidth: 1))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        
                        // Posts
                        ForEach(posts) { post in
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Circle()
                                        .fill(Color(red: 0.42, green: 0.36, blue: 0.91))
                                        .frame(width: 40, height: 40)
                                        .overlay(Text("E").foregroundColor(.white).fontWeight(.bold))
                                    
                                    VStack(alignment: .leading) {
                                        HStack(spacing: 4) {
                                            Text(post.celebName)
                                                .fontWeight(.bold)
                                                .foregroundColor(.white)
                                            Image(systemName: "checkmark.seal.fill")
                                                .font(.caption)
                                                .foregroundColor(.cyan)
                                        }
                                        Text(post.createdAt)
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                    
                                    // 1-on-1 VIP Video Call Button
                                    Button(action: {
                                        if userTier == .premiumVip {
                                            callingCelebrity = post.celebName
                                        } else {
                                            showPaywall = true
                                        }
                                    }) {
                                        HStack(spacing: 4) {
                                            Image(systemName: userTier == .premiumVip ? "video.fill" : "lock.fill")
                                                .font(.caption)
                                            Text(userTier == .premiumVip ? "VIP Video" : "Unlock Video")
                                                .font(.caption)
                                                .fontWeight(.bold)
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(userTier == .premiumVip ? Color.cyan : Color(red: 0.42, green: 0.36, blue: 0.91))
                                        .foregroundColor(userTier == .premiumVip ? .black : .white)
                                        .cornerRadius(16)
                                    }
                                }
                                
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.black.opacity(0.4))
                                    .frame(height: 200)
                                    .overlay(
                                        Text(post.mediaType == "VIDEO" ? "▶ Video Stream" : "📷 Photo Post")
                                            .foregroundColor(.white)
                                            .fontWeight(.semibold)
                                    )
                                
                                Text(post.caption)
                                    .font(.subheadline)
                                    .foregroundColor(.white)
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
        .alert("🔒 VIP Video Membership Required", isPresented: $showPaywall) {
            Button("Upgrade with StoreKit ($9.99/mo)") {
                userTier = .premiumVip
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Live 1-on-1 face-to-face video calling and Celebrity Live Fan Connect is reserved for Premium VIP subscribers.")
        }
        .alert("📹 Connecting VIP Video Call...", isPresented: Binding(
            get: { callingCelebrity != nil },
            set: { if !$0 { callingCelebrity = nil } }
        )) {
            Button("End Video Call", role: .destructive) {
                callingCelebrity = nil
            }
        } message: {
            Text("High-definition WebRTC video connection active with \(callingCelebrity ?? "")")
        }
    }
}
