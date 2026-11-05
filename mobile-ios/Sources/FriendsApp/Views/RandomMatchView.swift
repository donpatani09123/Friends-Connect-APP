import SwiftUI

public struct RandomMatchView: View {
    @State private var matchMode = CallMode.video
    @State private var isSearching = false
    @State private var isConnected = false
    @State private var partnerName = "Maya Lin (San Francisco)"
    @State private var isMuted = false
    @State private var isVideoMuted = false
    @State private var isFrontCamera = true
    @State private var isSafetyBlurred = false
    @State private var radarScale: CGFloat = 1.0
    @State private var radarOpacity: Double = 0.8
    
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.06, green: 0.09, blue: 0.16).ignoresSafeArea()
            
            VStack(spacing: 16) {
                // Header & Mode Selector
                VStack(spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(matchMode == .video ? "Random Video Connect" : "Random Audio Connect")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text("Instant 1-on-1 random pairing")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        HStack(spacing: 6) {
                            Circle().fill(Color.green).frame(width: 8, height: 8)
                            Text("58 Online")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.green.opacity(0.15))
                        .cornerRadius(20)
                    }
                    
                    if !isSearching && !isConnected {
                        Picker("Match Mode", selection: $matchMode) {
                            Text("📹 Live Video").tag(CallMode.video)
                            Text("🎙️ Audio Only").tag(CallMode.audio)
                        }
                        .pickerStyle(.segmented)
                    }
                }
                .padding(.horizontal)
                .padding(.top)
                
                Spacer()
                
                // Center Radar or Active Video Stage
                if isSearching {
                    ZStack {
                        Circle()
                            .fill(matchMode == .video ? Color.cyan.opacity(radarOpacity) : Color(red: 0.42, green: 0.36, blue: 0.91).opacity(radarOpacity))
                            .frame(width: 140 * radarScale, height: 140 * radarScale)
                            .onAppear {
                                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                                    radarScale = 1.8
                                    radarOpacity = 0.0
                                }
                            }
                        
                        Circle()
                            .fill(Color(red: 0.12, green: 0.16, blue: 0.23))
                            .frame(width: 130, height: 130)
                            .overlay(
                                Image(systemName: matchMode == .video ? "video.fill" : "waveform")
                                    .font(.system(size: 44))
                                    .foregroundColor(matchMode == .video ? .cyan : Color(red: 0.42, green: 0.36, blue: 0.91))
                            )
                    }
                    Text("Searching for a \(matchMode == .video ? "video" : "voice") friend...")
                        .foregroundColor(.white)
                        .font(.subheadline)
                        .padding(.top, 10)
                } else if isConnected && matchMode == .video {
                    // Video Call Stage with PiP Self View
                    ZStack(alignment: .topTrailing) {
                        // Remote Peer Video Canvas
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.black)
                            .overlay(
                                Group {
                                    if !isSafetyBlurred {
                                        VStack(spacing: 12) {
                                            Circle()
                                                .fill(Color(red: 0.42, green: 0.36, blue: 0.91).opacity(0.4))
                                                .frame(width: 90, height: 90)
                                                .overlay(Image(systemName: "person.fill").font(.system(size: 45)).foregroundColor(.white))
                                            Text(partnerName)
                                                .font(.headline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.white)
                                            Text("Remote WebRTC Video Stream (720p)")
                                                .font(.caption2)
                                                .foregroundColor(.cyan)
                                        }
                                    } else {
                                        VStack(spacing: 8) {
                                            Image(systemName: "eye.slash.fill")
                                                .font(.largeTitle)
                                                .foregroundColor(.pink)
                                            Text("Video Feed Blurred by User")
                                                .font(.subheadline)
                                                .fontWeight(.bold)
                                                .foregroundColor(.white)
                                        }
                                    }
                                }
                            )
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                        
                        // Floating PiP Camera Self-View
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(red: 0.12, green: 0.16, blue: 0.23))
                            .frame(width: 90, height: 130)
                            .overlay(
                                VStack {
                                    if !isVideoMuted {
                                        Text("You (Self)")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                        Text(isFrontCamera ? "Front Cam" : "Rear Cam")
                                            .font(.system(size: 8))
                                            .foregroundColor(.gray)
                                    } else {
                                        Text("Cam Off")
                                            .font(.caption2)
                                            .foregroundColor(.pink)
                                    }
                                }
                            )
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.cyan, lineWidth: 1.5))
                            .padding()
                    }
                    .padding(.horizontal)
                } else if isConnected && matchMode == .audio {
                    // Audio Call View
                    VStack(spacing: 16) {
                        Circle()
                            .stroke(Color.cyan, lineWidth: 3)
                            .background(Circle().fill(Color(red: 0.12, green: 0.16, blue: 0.23)))
                            .frame(width: 120, height: 120)
                            .overlay(Image(systemName: "person.fill").font(.system(size: 60)).foregroundColor(.cyan))
                        
                        Text(partnerName)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Full-duplex WebRTC Audio")
                            .font(.caption)
                            .foregroundColor(.cyan)
                    }
                } else {
                    Circle()
                        .stroke(matchMode == .video ? Color.cyan : Color(red: 0.42, green: 0.36, blue: 0.91), lineWidth: 2)
                        .frame(width: 130, height: 130)
                        .overlay(
                            Image(systemName: matchMode == .video ? "video.badge.plus" : "waveform")
                                .font(.system(size: 50))
                                .foregroundColor(matchMode == .video ? .cyan : Color(red: 0.42, green: 0.36, blue: 0.91))
                        )
                }
                
                Spacer()
                
                // Bottom Controls
                if !isSearching && !isConnected {
                    Button(action: {
                        isSafetyBlurred = false
                        isSearching = true
                    }) {
                        HStack {
                            Image(systemName: matchMode == .video ? "video.fill" : "phone.fill")
                            Text(matchMode == .video ? "Start Random Video Match" : "Start Random Audio Match")
                                .fontWeight(.bold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(matchMode == .video ? Color.cyan : Color(red: 0.42, green: 0.36, blue: 0.91))
                        .foregroundColor(matchMode == .video ? .black : .white)
                        .cornerRadius(14)
                    }
                    .padding(.horizontal)
                } else if isSearching {
                    VStack(spacing: 12) {
                        Button(action: {
                            isSearching = false
                            isConnected = true
                        }) {
                            Text("Simulate Partner Found")
                                .fontWeight(.bold)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                                .foregroundColor(.white)
                                .cornerRadius(14)
                        }
                        Button("Cancel") { isSearching = false }
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal)
                } else {
                    // Active Video/Audio Call Controls
                    HStack(spacing: 16) {
                        // Mic Mute
                        Button(action: { isMuted.toggle() }) {
                            Image(systemName: isMuted ? "mic.slash.fill" : "mic.fill")
                                .font(.title3)
                                .frame(width: 48, height: 48)
                                .background(isMuted ? Color.pink : Color(red: 0.12, green: 0.16, blue: 0.23))
                                .foregroundColor(.white)
                                .clipShape(Circle())
                        }
                        
                        if matchMode == .video {
                            // Flip Cam
                            Button(action: { isFrontCamera.toggle() }) {
                                Image(systemName: "camera.rotate.fill")
                                    .font(.title3)
                                    .frame(width: 48, height: 48)
                                    .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                    .foregroundColor(.white)
                                    .clipShape(Circle())
                            }
                            
                            // Video Shutter Off
                            Button(action: { isVideoMuted.toggle() }) {
                                Image(systemName: isVideoMuted ? "video.slash.fill" : "video.fill")
                                    .font(.title3)
                                    .frame(width: 48, height: 48)
                                    .background(isVideoMuted ? Color.pink : Color(red: 0.12, green: 0.16, blue: 0.23))
                                    .foregroundColor(.white)
                                    .clipShape(Circle())
                            }
                        }
                        
                        // Next Friend
                        Button(action: {
                            isSafetyBlurred = false
                            partnerName = (partnerName.contains("Maya")) ? "Alex River (San Francisco)" : "Maya Lin (San Francisco)"
                        }) {
                            HStack(spacing: 4) {
                                Image(systemName: "forward.fill")
                                Text("Next")
                                    .fontWeight(.bold)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color(red: 0.42, green: 0.36, blue: 0.91))
                            .foregroundColor(.white)
                            .cornerRadius(24)
                        }
                        
                        // Safety Blur/Report
                        Button(action: { isSafetyBlurred.toggle() }) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.title3)
                                .frame(width: 48, height: 48)
                                .background(Color(red: 0.2, green: 0.2, blue: 0.3))
                                .foregroundColor(.pink)
                                .clipShape(Circle())
                        }
                        
                        // Hang up
                        Button(action: { isConnected = false; isSearching = false }) {
                            Image(systemName: "phone.down.fill")
                                .font(.title3)
                                .frame(width: 48, height: 48)
                                .background(Color.red)
                                .foregroundColor(.white)
                                .clipShape(Circle())
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
        }
    }
}
