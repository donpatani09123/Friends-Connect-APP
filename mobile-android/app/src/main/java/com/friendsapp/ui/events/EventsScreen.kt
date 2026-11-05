package com.friendsapp.ui.events

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendsapp.model.EventItem
import com.friendsapp.model.GeoLocation
import com.friendsapp.ui.theme.PrimaryNeon
import com.friendsapp.ui.theme.SecondaryNeon

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventsScreen(
    userLocationName: String = "San Francisco, CA"
) {
    var selectedEventForBooking by remember { mutableStateOf<EventItem?>(null) }
    var ticketCount by remember { mutableStateOf(1) }
    var isBookingSuccess by remember { mutableStateOf(false) }

    val sampleEvents = remember {
        listOf(
            EventItem(
                id = "event-001",
                orgId = "org-001",
                orgName = "RedBull Events & Productions",
                title = "Neon Nights: Electronic Music Fest 2026",
                description = "Experience 12 hours of non-stop electronic synthwave, food trucks, and light installations.",
                category = "Music & Concerts",
                location = GeoLocation(37.7749, -122.4194),
                venueName = "The Midway SF",
                address = "900 Marin St, San Francisco, CA",
                startTime = "Sat, 8:00 PM",
                endTime = "Sun, 4:00 AM",
                totalCapacity = 500,
                bookedSeats = 142,
                ticketPrice = 35.0,
                distanceKm = 1.4
            ),
            EventItem(
                id = "event-002",
                orgId = "org-001",
                orgName = "Bay Area Founders Club",
                title = "Tech & Friends Networking Mixer",
                description = "Casual networking evening for founders, mobile developers, and creators with complimentary drinks.",
                category = "Networking",
                location = GeoLocation(37.7833, -122.4167),
                venueName = "Salesforce Park Rooftop",
                address = "425 Mission St, San Francisco, CA",
                startTime = "Tomorrow, 6:30 PM",
                endTime = "Tomorrow, 9:30 PM",
                totalCapacity = 150,
                bookedSeats = 89,
                ticketPrice = 0.0,
                distanceKm = 2.8
            )
        )
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Location",
                        tint = PrimaryNeon,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Events Near You",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
                Text(
                    text = userLocationName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
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
            items(sampleEvents) { event ->
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
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = PrimaryNeon.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = event.category,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PrimaryNeon,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                            event.distanceKm?.let { dist ->
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = SecondaryNeon.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = "$dist km away",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SecondaryNeon,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = event.title,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        Text(
                            text = event.description,
                            fontSize = 13.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(vertical = 6.dp)
                        )

                        Row(
                            modifier = Modifier.padding(top = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = event.venueName, fontSize = 12.sp, color = Color.LightGray)
                        }

                        Row(
                            modifier = Modifier.padding(top = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.DateRange, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = event.startTime, fontSize = 12.sp, color = Color.LightGray)
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = if (event.ticketPrice == 0.0) "FREE" else "$${event.ticketPrice}",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (event.ticketPrice == 0.0) SecondaryNeon else Color.White
                                )
                                Text(
                                    text = "${event.totalCapacity - event.bookedSeats} seats left",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                            }

                            Button(
                                onClick = {
                                    selectedEventForBooking = event
                                    isBookingSuccess = false
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeon)
                            ) {
                                Text("Book Ticket", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Booking Bottom Sheet
        if (selectedEventForBooking != null) {
            ModalBottomSheet(
                onDismissRequest = { selectedEventForBooking = null },
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (!isBookingSuccess) {
                        Text(
                            text = "Confirm Booking",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = selectedEventForBooking!!.title,
                            fontSize = 14.sp,
                            color = PrimaryNeon,
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Tickets Quantity", color = Color.White)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                OutlinedButton(onClick = { if (ticketCount > 1) ticketCount-- }) { Text("-") }
                                Text("$ticketCount", modifier = Modifier.padding(horizontal = 16.dp), color = Color.White)
                                OutlinedButton(onClick = { ticketCount++ }) { Text("+") }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { isBookingSuccess = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryNeon)
                        ) {
                            Text("Confirm & Generate QR Pass", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Text("🎉 Booking Confirmed!", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SecondaryNeon)
                        Text("Pass Code: PASS-X892JK", fontSize = 16.sp, color = Color.White, modifier = Modifier.padding(vertical = 12.dp))
                        Button(onClick = { selectedEventForBooking = null }) {
                            Text("Done")
                        }
                    }
                }
            }
        }
    }
}
