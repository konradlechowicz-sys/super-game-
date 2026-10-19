import Foundation
import Capacitor
import StoreKit

/// In-app purchase bridge for the game (StoreKit 2). JavaScript side: js/store.js via registerPlugin('VoidStore').
/// The game sells one non-consumable product, the full game; Apple keeps the receipt, so ownership is always
/// read back from StoreKit's current entitlements (works offline and after reinstalling).
@objc(StorePlugin)
public class StorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StorePlugin"
    public let jsName = "VoidStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isOwned", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        // Purchases approved later (Ask to Buy), refunds and purchases made on another device arrive here.
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                self?.notifyListeners("owned", data: [
                    "productId": transaction.productID,
                    "owned": transaction.revocationDate == nil,
                ])
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    @objc func getProduct(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing product id"); return }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Product not found")
                    return
                }
                call.resolve([
                    "id": product.id,
                    "price": product.displayPrice,
                    "title": product.displayName,
                    "description": product.description,
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func isOwned(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing product id"); return }
        Task {
            call.resolve(["owned": await StorePlugin.owns(id)])
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing product id"); return }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Product not found")
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["status": "purchased"])
                    case .unverified:
                        call.resolve(["status": "error"])
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "error"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing product id"); return }
        Task {
            // Asks the App Store to sync this Apple ID's purchases; the user may cancel the sign-in prompt.
            try? await AppStore.sync()
            call.resolve(["owned": await StorePlugin.owns(id)])
        }
    }

    private static func owns(_ id: String) async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.productID == id, transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }
}
