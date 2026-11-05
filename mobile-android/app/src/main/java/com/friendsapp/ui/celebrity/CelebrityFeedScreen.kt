package com.friendsapp.ui.celebrity

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.friendsapp.model.AccountTier
import com.friendsapp.model.CelebrityPost
import com.friendsapp.ui.theme.AccentPink
import com.friendsapp.ui.theme.PrimaryNeon
import com.friendsapp.ui.theme.SecondaryNeon

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CelebrityFeedScreen(
    userTier: AccountTier = AccountTier.FREE,
    onUpgradeTier: () -> Unit
) {
    var showPaywallDialog by remember { mutableStateOf(false) }
    var activeVideoCallCelebrityName by remember { mutableStateOf<String?>(null) }
    var isCelebrityLiveFanConnectActive by remember { mutableStateOf(true) }

    val samplePosts = remember {
        listOf(
            CelebrityPost(
                id = "post-001",
                celebUserId = "celeb-001",
                celebName = "Elena Rostova",
                mediaType = "IMAGE",
                mediaUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000",
                caption = "Backstage vibes right before tonight’s acoustic performance! 🎸✨",
                likesCount = 12480,
                commentsCount = 432,
                createdAt = "2 hours ago"
            ),
            CelebrityPost(
                id = "post-002",
                celebUserId = "celeb-001",
                celebName = "Elena Rostova",
                mediaType = "VIDEO",
                mediaUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                caption = "Sneak preview of our brand new music video release! 🎥🔥",
                likesCount = 28900,
                commentsCount = 914,
                createdAt = "Yesterday"
            )
        )
    }

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Celebrity Hub",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "1-on-1 VIP Video Calls & Live Fan Meetups",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (userTier == AccountTier.PREMIUM_VIP) SecondaryNeon.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
                ) {
                    Text(
                        text = if (userTier == AccountTier.PREMIUM_VIP) "VIP ACTIVE" else "FREE TIER",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (userTier == AccountTier.PREMIUM_VIP) SecondaryNeon else AccentPink,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Celebrity Live Fan Connect Banner
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = PrimaryNeon.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(SecondaryNeon)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("LIVE FAN CONNECT", color = SecondaryNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Text("Elena Rostova is taking Random Video Calls now!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Exclusive for VIP Subscribers • 3 min per fan", color = Color.LightGray, fontSize = 11.sp)
                        }

                        Button(
                            onClick = {
                                if (userTier == AccountTier.PREMIUM_VIP) {
                                    activeVideoCallCelebrityName = "Elena Rostova (Fan Connect Live)"
                                } else {
                                    showPaywallDialog = true
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = SecondaryNeon),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Join Video", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }

            // Posts
            items(samplePosts) { post ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryNeon),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(post.celebName.take(1), fontWeight = FontWeight.Bold, color = Color.White)
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = post.celebName,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            fontSize = 15.sp
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SecondaryNeon, modifier = Modifier.size(16.dp))
                                    }
                                    Text(text = post.createdAt, fontSize = 11.sp, color = Color.Gray)
                                }
                            }

                            // VIP Video Call Button
                            Button(
                                onClick = {
                                    if (userTier == AccountTier.PREMIUM_VIP) {
                                        activeVideoCallCelebrityName = post.celebName
                                    } else {
                                        showPaywallDialog = true
                                    }
                                },
                                shape = RoundedCornerShape(20.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (userTier == AccountTier.PREMIUM_VIP) SecondaryNeon else PrimaryNeon
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(
                                    if (userTier == AccountTier.PREMIUM_VIP) Icons.Default.PlayArrow else Icons.Default.Lock,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = if (userTier == AccountTier.PREMIUM_VIP) Color.Black else Color.White
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (userTier == AccountTier.PREMIUM_VIP) "VIP Video" else "Unlock Video",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (userTier == AccountTier.PREMIUM_VIP) Color.Black else Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Video/Photo Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.DarkGray),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (post.mediaType == "VIDEO") "▶ Celebrity Video Stream" else "📷 Celebrity Photo",
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text(text = post.caption, color = Color.White, fontSize = 14.sp)
                    }
                }
            }
        }

        // Paywall Dialog
        if (showPaywallDialog) {
            AlertDialog(
                onDismissRequest = { showPaywallDialog = false },
                title = { Text("🔒 Exclusive VIP Video Call", fontWeight = FontWeight.Bold, color = Color.White) },
                text = {
                    Text(
                        "Live 1-on-1 face-to-face video calling with verified stars and access to the Celebrity Random Fan Connect pool requires a Premium VIP membership. Subscribe now!",
                        color = Color.LightGray
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showPaywallDialog = false
                            onUpgradeTier()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeon)
                    ) {
                        Text("Upgrade to VIP ($9.99/mo)")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showPaywallDialog = false }) {
                        Text("Cancel", color = Color.Gray)
                    }
                },
                containerColor = MaterialTheme.colorScheme.surface
            )
        }

        // Active Video Call Modal
        if (activeVideoCallCelebrityName != null) {
            AlertDialog(
                onDismissRequest = { activeVideoCallCelebrityName = null },
                title = { Text("📹 Live VIP Video Call Active", color = Color.White) },
                text = {
                    Text("Connected to $activeVideoCallCelebrityName on high-definition WebRTC two-way video.", color = Color.LightGray)
                },
                confirmButton = {
                    Button(
                        onClick = { activeVideoCallCelebrityName = null },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentPink)
                    ) {
                        Text("End Video Call")
                    }
                },
                containerColor = MaterialTheme.colorScheme.surface
            )
        }
    }
}
