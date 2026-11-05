import SwiftUI

public struct PhoneAuthView: View {
    @ObservedObject var network = NetworkService.shared
    @State private var phoneNumber = "+19876543210"
    @State private var otpCode = ""
    @State private var isOtpSent = false
    @State private var selectedRole = UserRole.normal
    @State private var isLoading = false
    @State private var errorMessage: String? = nil
    
    var onLoginSuccess: (User) -> Void
    
    public init(onLoginSuccess: @escaping (User) -> Void) {
        self.onLoginSuccess = onLoginSuccess
    }
    
    public var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Friends & Events")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red: 0.42, green: 0.36, blue: 0.91))
                    
                    Text("Connect with random friends & discover local events")
                        .font(.footnote)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)
                
                // Role Picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("Select Account Type")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    
                    Picker("Role", selection: $selectedRole) {
                        Text("Normal").tag(UserRole.normal)
                        Text("Celebrity").tag(UserRole.celebrity)
                        Text("Organization").tag(UserRole.organization)
                    }
                    .pickerStyle(.segmented)
                }
                
                // Phone & OTP inputs
                VStack(spacing: 16) {
                    TextField("Phone Number (+1XXXXXXXXXX)", text: $phoneNumber)
                        .keyboardType(.phonePad)
                        .padding()
                        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                        .disabled(isOtpSent)
                    
                    if isOtpSent {
                        TextField("6-Digit OTP Code", text: $otpCode)
                            .keyboardType(.numberPad)
                            .padding()
                            .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                            .cornerRadius(12)
                            .foregroundColor(.white)
                    }
                }
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                Button(action: handleAction) {
                    HStack {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text(isOtpSent ? "Verify & Enter" : "Send OTP Verification")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                
                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
    
    private func handleAction() {
        if !isOtpSent {
            isOtpSent = true
            otpCode = "123456"
        } else {
            let user = User(
                id: "user-ios-001",
                phoneNumber: phoneNumber,
                role: selectedRole,
                tier: selectedRole == .normal ? .free : .premiumVip,
                isVerified: true,
                isBlocked: false
            )
            onLoginSuccess(user)
        }
    }
}
