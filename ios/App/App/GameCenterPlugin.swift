import Foundation
import Capacitor
import GameKit

/// Game Center bridge for the game (v1.3): sign-in, scores for the Endless leaderboards (one per world, score = kills)
/// and Apple's leaderboard screen. JavaScript side: js/leaderboard.js via registerPlugin('VoidGameCenter').
/// The leaderboards themselves are set up in App Store Connect (ids in js/leaderboard.js).
@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "GameCenterPlugin"
    public let jsName = "VoidGameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboard", returnType: CAPPluginReturnPromise),
    ]

    // Game Center calls the sign-in handler again whenever the player's state changes; only the first answer of each
    // signIn call is sent back.
    private var pending: [CAPPluginCall] = []
    private var handlerSet = false

    @objc func signIn(_ call: CAPPluginCall) {
        let player = GKLocalPlayer.local
        if player.isAuthenticated { call.resolve(["signedIn": true]); return }
        pending.append(call)
        if handlerSet { return }
        handlerSet = true
        player.authenticateHandler = { [weak self] viewController, error in
            guard let self = self else { return }
            if let viewController = viewController {
                // not signed in yet: Apple's sign-in screen; the handler runs again when it closes
                DispatchQueue.main.async { self.bridge?.viewController?.present(viewController, animated: true) }
                return
            }
            let calls = self.pending
            self.pending.removeAll()
            for c in calls {
                c.resolve(["signedIn": player.isAuthenticated, "error": error?.localizedDescription ?? ""])
            }
        }
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard let id = call.getString("leaderboardId"), let score = call.getInt("score") else {
            call.reject("Missing leaderboard id or score")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else { call.resolve(["submitted": false]); return }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [id]) { error in
            call.resolve(["submitted": error == nil, "error": error?.localizedDescription ?? ""])
        }
    }

    @objc func showLeaderboard(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let screen: GKGameCenterViewController
            if let id = call.getString("leaderboardId") {
                screen = GKGameCenterViewController(leaderboardID: id, playerScope: .global, timeScope: .allTime)
            } else {
                screen = GKGameCenterViewController(state: .leaderboards)
            }
            screen.gameCenterDelegate = self
            self.bridge?.viewController?.present(screen, animated: true)
            call.resolve()
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
