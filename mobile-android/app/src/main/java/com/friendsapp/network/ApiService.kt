package com.friendsapp.network

import com.friendsapp.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/otp/request")
    suspend fun requestOtp(@Body payload: Map<String, String>): Response<Map<String, String>>

    @POST("api/auth/otp/verify")
    suspend fun verifyOtp(@Body payload: Map<String, String>): Response<AuthResponse>

    @GET("api/events/nearby")
    suspend fun getNearbyEvents(
        @Query("lat") lat: Double?,
        @Query("lng") lng: Double?,
        @Query("radiusKm") radiusKm: Double?
    ): Response<Map<String, Any>>

    @POST("api/events/{id}/book")
    suspend fun bookEvent(
        @Header("Authorization") token: String,
        @Path("id") eventId: String,
        @Body payload: Map<String, Int>
    ): Response<Map<String, Any>>

    @GET("api/celebrities/feed")
    suspend fun getCelebrityFeed(): Response<Map<String, List<CelebrityPost>>>

    @GET("api/celebrities/{id}/check-access")
    suspend fun checkCelebrityAccess(
        @Header("Authorization") token: String,
        @Path("id") celebId: String
    ): Response<Map<String, Any>>

    @POST("api/calls/initiate")
    suspend fun initiateCall(
        @Header("Authorization") token: String,
        @Body payload: Map<String, String>
    ): Response<Map<String, Any>>

    @POST("api/support/connect")
    suspend fun connectSupport(
        @Header("Authorization") token: String
    ): Response<Map<String, Any>>
}
