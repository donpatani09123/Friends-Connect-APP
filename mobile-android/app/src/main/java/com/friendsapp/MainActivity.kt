package com.friendsapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.friendsapp.model.AccountTier
import com.friendsapp.ui.auth.PhoneAuthScreen
import com.friendsapp.ui.celebrity.CelebrityFeedScreen
import com.friendsapp.ui.events.EventsScreen
import com.friendsapp.ui.matchmaking.RandomMatchScreen
import com.friendsapp.ui.support.SupportScreen
import com.friendsapp.ui.theme.FriendsAppTheme
import com.friendsapp.ui.theme.PrimaryNeon

enum class NavigationTab {
    RANDOM_MATCH, EVENTS, CELEBRITIES, SUPPORT
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FriendsAppTheme {
                var isAuthenticated by remember { mutableStateOf(false) }
                var userToken by remember { mutableStateOf("") }
                var userId by remember { mutableStateOf("") }
                var userRole by remember { mutableStateOf("NORMAL") }
                var userTier by remember { mutableStateOf(AccountTier.FREE) }
                var currentTab by remember { mutableStateOf(NavigationTab.RANDOM_MATCH) }

                if (!isAuthenticated) {
                    PhoneAuthScreen(
                        onLoginSuccess = { token, id, role ->
                            userToken = token
                            userId = id
                            userRole = role
                            isAuthenticated = true
                        }
                    )
                } else {
                    Scaffold(
                        bottomBar = {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface
                            ) {
                                NavigationBarItem(
                                    selected = currentTab == NavigationTab.RANDOM_MATCH,
                                    onClick = { currentTab = NavigationTab.RANDOM_MATCH },
                                    icon = { Icon(Icons.Default.Call, contentDescription = "Random Audio") },
                                    label = { Text("Connect") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = PrimaryNeon,
                                        selectedTextColor = PrimaryNeon
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == NavigationTab.EVENTS,
                                    onClick = { currentTab = NavigationTab.EVENTS },
                                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Events") },
                                    label = { Text("Events") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = PrimaryNeon,
                                        selectedTextColor = PrimaryNeon
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == NavigationTab.CELEBRITIES,
                                    onClick = { currentTab = NavigationTab.CELEBRITIES },
                                    icon = { Icon(Icons.Default.Star, contentDescription = "Celebrities") },
                                    label = { Text("Stars") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = PrimaryNeon,
                                        selectedTextColor = PrimaryNeon
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == NavigationTab.SUPPORT,
                                    onClick = { currentTab = NavigationTab.SUPPORT },
                                    icon = { Icon(Icons.Default.Info, contentDescription = "Support") },
                                    label = { Text("Care") },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = PrimaryNeon,
                                        selectedTextColor = PrimaryNeon
                                    )
                                )
                            }
                        }
                    ) { innerPadding ->
                        Surface(
                            modifier = Modifier.padding(innerPadding),
                            color = MaterialTheme.colorScheme.background
                        ) {
                            when (currentTab) {
                                NavigationTab.RANDOM_MATCH -> RandomMatchScreen(userId = userId)
                                NavigationTab.EVENTS -> EventsScreen()
                                NavigationTab.CELEBRITIES -> CelebrityFeedScreen(
                                    userTier = userTier,
                                    onUpgradeTier = { userTier = AccountTier.PREMIUM_VIP }
                                )
                                NavigationTab.SUPPORT -> SupportScreen()
                            }
                        }
                    }
                }
            }
        }
    }
}
