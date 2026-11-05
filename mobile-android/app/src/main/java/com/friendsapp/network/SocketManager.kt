package com.friendsapp.network

import android.util.Log
import com.friendsapp.model.MatchFoundEvent
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import org.json.JSONObject

object SocketManager {
    private const val TAG = "SocketManager"
    private var socket: Socket? = null
    private val gson = Gson()

    private val _matchFoundEvents = MutableSharedFlow<MatchFoundEvent>(extraBufferCapacity = 1)
    val matchFoundEvents: SharedFlow<MatchFoundEvent> = _matchFoundEvents

    private val _onlineCount = MutableSharedFlow<Int>(extraBufferCapacity = 1)
    val onlineCount: SharedFlow<Int> = _onlineCount

    fun connect(baseUrl: String, userId: String) {
        if (socket?.connected() == true) return

        try {
            val opts = IO.Options().apply {
                reconnection = true
                reconnectionDelay = 1000
                timeout = 10000
            }
            socket = IO.socket(baseUrl, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket connected: ${socket?.id()}")
                // Register presence
                val payload = JSONObject().put("userId", userId)
                socket?.emit("register_presence", payload)
            }

            socket?.on("presence_update") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val count = data?.optInt("onlineCount", 0) ?: 0
                    _onlineCount.tryEmit(count)
                }
            }

            socket?.on("match_found") { args ->
                if (args.isNotEmpty()) {
                    val jsonString = args[0].toString()
                    val matchEvent = gson.fromJson(jsonString, MatchFoundEvent::class.java)
                    Log.d(TAG, "Match found: Room ${matchEvent.roomId} with ${matchEvent.peerName}")
                    _matchFoundEvents.tryEmit(matchEvent)
                }
            }

            socket?.connect()
        } catch (e: Exception) {
            Log.e(TAG, "Socket connect error", e)
        }
    }

    fun findRandomMatch(userId: String) {
        val payload = JSONObject().put("userId", userId)
        socket?.emit("find_random_match", payload)
    }

    fun cancelMatchmaking(userId: String) {
        val payload = JSONObject().put("userId", userId)
        socket?.emit("cancel_matchmaking", payload)
    }

    fun hangup(roomId: String) {
        val payload = JSONObject().put("roomId", roomId)
        socket?.emit("hangup_call", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
