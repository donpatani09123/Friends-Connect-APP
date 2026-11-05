// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FriendsAppiOS",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "FriendsAppCore",
            targets: ["FriendsAppCore"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "FriendsAppCore",
            dependencies: [],
            path: "Sources/FriendsApp"
        ),
        .testTarget(
            name: "FriendsAppTests",
            dependencies: ["FriendsAppCore"],
            path: "Tests/FriendsAppTests"
        ),
    ]
)
