import SwiftUI

public struct SupportCareView: View {
    @State private var isCallingSupport = false
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(spacing: 24) {
                VStack(spacing: 6) {
                    Text("Customer Care Desk")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("24/7 Voice & Chat Support")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .padding(.top)
                
                VStack(alignment: .leading, spacing: 14) {
                    Text("Live Support Representative")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Text("Reach out directly regarding ticket issues, user verification, or reporting violations.")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    Button(action: { isCallingSupport = true }) {
                        HStack {
                            Image(systemName: "phone.fill")
                            Text("Call Customer Care")
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding()
                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                .cornerRadius(16)
                .padding(.horizontal)
                
                if isCallingSupport {
                    HStack {
                        Image(systemName: "phone.fill.badge.checkmark")
                            .foregroundColor(.cyan)
                        Text("Connected with Sarah (Support Desk)")
                            .font(.subheadline)
                            .foregroundColor(.white)
                        Spacer()
                        Button("End") {
                            isCallingSupport = false
                        }
                        .foregroundColor(.red)
                    }
                    .padding()
                    .background(Color.cyan.opacity(0.15))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                Spacer()
            }
        }
    }
}
