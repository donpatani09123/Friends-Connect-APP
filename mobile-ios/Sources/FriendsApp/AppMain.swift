import SwiftUI

@main
public struct FriendsApp: App {
    @State private var isAuthenticated = false
    @State private var currentUser: User? = nil
    @State private var userTier: AccountTier = .free
    
    public init() {}
    
    public var body: some Scene {
        WindowGroup {
            if !isAuthenticated {
                PhoneAuthView { user in
                    self.currentUser = user
                    self.userTier = user.tier
                    self.isAuthenticated = true
                }
            } else {
                TabView {
                    RandomMatchView()
                        .tabItem {
                            Label("Connect", systemImage: "waveform")
                        }
                    
                    GeoEventsView()
                        .tabItem {
                            Label("Events", systemImage: "mappin.and.ellipse")
                        }
                    
                    CelebrityFeedView(userTier: $userTier)
                        .tabItem {
                            Label("Stars", systemImage: "star.fill")
                        }
                    
                    SupportCareView()
                        .tabItem {
                            Label("Care", systemImage: "headphones")
                        }
                }
                .tint(Color(red: 0.42, green: 0.36, blue: 0.91))
            }
        }
    }
}
