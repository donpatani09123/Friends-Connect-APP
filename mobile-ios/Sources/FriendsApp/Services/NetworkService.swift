import Foundation

public class NetworkService: ObservableObject {
    public static let shared = NetworkService()
    public let baseURL = "http://localhost:4000/api"
    
    @Published public var authToken: String? = nil
    @Published public var currentUser: User? = nil
    
    private init() {}
    
    public func requestOtp(phoneNumber: String) async throws -> String {
        guard let url = URL(string: "\(baseURL)/auth/otp/request") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["phoneNumber": phoneNumber]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return json?["devOtp"] as? String ?? "123456"
    }
    
    public func verifyOtp(phoneNumber: String, code: String, role: UserRole) async throws -> User {
        guard let url = URL(string: "\(baseURL)/auth/otp/verify") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "phoneNumber": phoneNumber,
            "code": code,
            "role": role.rawValue
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        self.authToken = json?["accessToken"] as? String
        
        let user = User(
            id: "user-ios-001",
            phoneNumber: phoneNumber,
            role: role,
            tier: role == .normal ? .free : .premiumVip,
            isVerified: true,
            isBlocked: false
        )
        self.currentUser = user
        return user
    }
}
