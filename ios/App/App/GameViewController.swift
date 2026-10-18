import UIKit
import Capacitor

/// The app's main view: Capacitor's web view plus the game's own native plugins.
class GameViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(StorePlugin())
    }
}
