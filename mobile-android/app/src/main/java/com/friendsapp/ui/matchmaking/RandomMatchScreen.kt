package com.friendsapp.ui.matchmaking

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendsapp.model.CallMode
import com.friendsapp.ui.theme.AccentPink
import com.friendsapp.ui.theme.PrimaryNeon
import com.friendsapp.ui.theme.SecondaryNeon

enum class MatchState {
    IDLE, SEARCHING, CONNECTED
}

@Composable
fun RandomMatchScreen(
    userId: String,
    onlineCount: Int = 42
) {
    var matchMode by remember { mutableStateOf(CallMode.VIDEO) }
    var matchState by remember { mutableStateOf(MatchState.IDLE) }
    var partnerName by remember { mutableStateOf("Alex River (San Francisco)") }
    var isMuted by remember { mutableStateOf(false) }
    var isVideoMuted by remember { mutableStateOf(false) }
    var isFrontCamera by remember { mutableStateOf(true) }
    var isSafetyBlurred by remember { mutableStateOf(false) }

    // Pulsing radar animation
    val infiniteTransition = rememberInfiniteTransition(label = "RadarPulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "RadarScale"
    )
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "RadarAlpha"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header & Mode Selector
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (matchMode == CallMode.VIDEO) "Random Video Connect" else "Random Audio Connect",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Instant 1-on-1 random pairing",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                Surface(
                    color = SecondaryNeon.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(SecondaryNeon)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "$onlineCount Online",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SecondaryNeon
                        )
                    }
                }
            }

            // Mode Selector Toggle (Disabled during active call)
            if (matchState == MatchState.IDLE) {
                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                        .padding(4.dp)
                ) {
                    Button(
                        onClick = { matchMode = CallMode.VIDEO },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (matchMode == CallMode.VIDEO) PrimaryNeon else Color.Transparent,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Live Video", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                    Button(
                        onClick = { matchMode = CallMode.AUDIO },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (matchMode == CallMode.AUDIO) PrimaryNeon else Color.Transparent,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Audio Only", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }

        // Center Area: Video Stage / Audio Radar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(vertical = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            if (matchState == MatchState.SEARCHING) {
                Box(contentAlignment = Alignment.Center) {
                    Box(
                        modifier = Modifier
                            .size(160.dp * scale)
                            .clip(CircleShape)
                            .background(if (matchMode == CallMode.VIDEO) SecondaryNeon.copy(alpha = alpha) else PrimaryNeon.copy(alpha = alpha))
                    )
                    Box(
                        modifier = Modifier
                            .size(140.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surface)
                            .border(2.dp, if (matchMode == CallMode.VIDEO) SecondaryNeon else PrimaryNeon, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = if (matchMode == CallMode.VIDEO) Icons.Default.PlayArrow else Icons.Default.Call,
                                contentDescription = null,
                                tint = if (matchMode == CallMode.VIDEO) SecondaryNeon else PrimaryNeon,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Searching...", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else if (matchState == MatchState.CONNECTED && matchMode == CallMode.VIDEO) {
                // Live Video Stage with PiP Self View
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black)
                        .border(1.dp, Color.DarkGray, RoundedCornerShape(20.dp))
                ) {
                    // Remote Peer Video Box
                    if (!isSafetyBlurred) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryNeon.copy(alpha = 0.4f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(60.dp))
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(partnerName, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Remote WebRTC Video Stream (720p)", color = SecondaryNeon, fontSize = 11.sp)
                            }
                        }
                    } else {
                        // Safety Blur Overlay
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.9f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = AccentPink, modifier = Modifier.size(48.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Video Feed Blurred by Safety Filter", color = Color.White, fontWeight = FontWeight.Bold)
                                Text("Incident report logged to moderation desk", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    }

                    // Floating Self PiP Preview (Top Right)
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(12.dp)
                            .size(width = 100.dp, height = 140.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF1E293B))
                            .border(2.dp, SecondaryNeon, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (!isVideoMuted) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("You (Self)", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                Text(if (isFrontCamera) "Front Cam" else "Rear Cam", color = Color.Gray, fontSize = 9.sp)
                            }
                        } else {
                            Text("Cam Off", color = AccentPink, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else if (matchState == MatchState.CONNECTED && matchMode == CallMode.AUDIO) {
                // Audio Call Avatar
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .border(3.dp, SecondaryNeon, CircleShape)
                            .background(MaterialTheme.colorScheme.surface),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = SecondaryNeon, modifier = Modifier.size(64.dp))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(partnerName, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Live WebRTC Audio Active", fontSize = 12.sp, color = SecondaryNeon)
                }
            } else {
                // IDLE
                Box(
                    modifier = Modifier
                        .size(130.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                        .border(2.dp, if (matchMode == CallMode.VIDEO) SecondaryNeon else PrimaryNeon, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (matchMode == CallMode.VIDEO) Icons.Default.PlayArrow else Icons.Default.Call,
                        contentDescription = null,
                        tint = if (matchMode == CallMode.VIDEO) SecondaryNeon else PrimaryNeon,
                        modifier = Modifier.size(56.dp)
                    )
                }
            }
        }

        // Bottom Controls
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (matchState == MatchState.IDLE) {
                Button(
                    onClick = {
                        isSafetyBlurred = false
                        matchState = MatchState.SEARCHING
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = if (matchMode == CallMode.VIDEO) SecondaryNeon else PrimaryNeon)
                ) {
                    Text(
                        text = if (matchMode == CallMode.VIDEO) "Start Random Video Match" else "Start Random Audio Match",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (matchMode == CallMode.VIDEO) Color.Black else Color.White
                    )
                }
            } else if (matchState == MatchState.SEARCHING) {
                Button(
                    onClick = { matchState = MatchState.CONNECTED },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeon)
                ) {
                    Text("Simulate Partner Found", fontSize = 15.sp)
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { matchState = MatchState.IDLE },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Cancel", color = Color.White)
                }
            } else {
                // Active Controls (Video & Audio)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Mute Mic
                    FilledIconButton(
                        onClick = { isMuted = !isMuted },
                        colors = IconButtonDefaults.filledIconButtonColors(
                            containerColor = if (isMuted) AccentPink else MaterialTheme.colorScheme.surface
                        ),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(if (isMuted) Icons.Default.Close else Icons.Default.Notifications, contentDescription = "Mute", tint = Color.White)
                    }

                    // Flip Camera (If video mode)
                    if (matchMode == CallMode.VIDEO) {
                        FilledIconButton(
                            onClick = { isFrontCamera = !isFrontCamera },
                            colors = IconButtonDefaults.filledIconButtonColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Flip Camera", tint = Color.White)
                        }

                        // Video Cam Toggle
                        FilledIconButton(
                            onClick = { isVideoMuted = !isVideoMuted },
                            colors = IconButtonDefaults.filledIconButtonColors(
                                containerColor = if (isVideoMuted) AccentPink else MaterialTheme.colorScheme.surface
                            ),
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(if (isVideoMuted) Icons.Default.Clear else Icons.Default.PlayArrow, contentDescription = "Cam Off", tint = Color.White)
                        }
                    }

                    // Next Friend (Skip Partner)
                    Button(
                        onClick = {
                            isSafetyBlurred = false
                            matchState = MatchState.SEARCHING
                            partnerName = if (partnerName.contains("Alex")) "Maya Lin (San Francisco)" else "Alex River (San Francisco)"
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeon),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Next", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    // Report & Blur Safety Button
                    FilledIconButton(
                        onClick = { isSafetyBlurred = true },
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color(0xFF334155)),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = "Report/Blur", tint = AccentPink)
                    }

                    // End Call
                    FilledIconButton(
                        onClick = { matchState = MatchState.IDLE },
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = AccentPink),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "End Call", tint = Color.White)
                    }
                }
            }
        }
    }
}
