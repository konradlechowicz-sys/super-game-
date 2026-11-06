package com.konradlechowicz.voidblaster;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * The full-game purchase on Android: Google Play Billing (8.x) behind the same "VoidStore" plugin as the iOS StoreKit one
 * (ios/App/App/StorePlugin.swift), so js/store.js works unchanged: getProduct (price), isOwned, purchase
 * ('purchased' | 'cancelled' | 'pending' | 'error'), restore, and an 'owned' event when a purchase completes later
 * (a pending payment) or is refunded. The product is a one-time in-app product in Play Console with the same id as on
 * the App Store (com.konradlechowicz.voidblaster.fullgame). Purchases are acknowledged, or Google refunds them.
 */
@CapacitorPlugin(name = "VoidStore")
public class StorePlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billing;
    private PluginCall buying; // the purchase call waiting for Google Play's answer

    @Override
    public void load() {
        billing = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
        connect(null, null);
    }

    // Connects to Google Play (again, after a disconnect) and then runs ready, or failed when Play is unavailable.
    private void connect(Runnable ready, Runnable failed) {
        if (billing.isReady()) { if (ready != null) ready.run(); return; }
        billing.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { if (ready != null) ready.run(); }
                else if (failed != null) failed.run();
            }

            @Override
            public void onBillingServiceDisconnected() { /* the next call connects again */ }
        });
    }

    private void withProduct(String id, PluginCall call, ProductCallback then) {
        connect(() -> {
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(id).setProductType(BillingClient.ProductType.INAPP).build()))
                .build();
            // Billing 8: the answer is a QueryProductDetailsResult (found products + the ones Play could not fetch)
            billing.queryProductDetailsAsync(params, (result, found) -> {
                List<ProductDetails> list = found != null ? found.getProductDetailsList() : null;
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || list == null || list.isEmpty()) {
                    call.reject("product unavailable");
                    return;
                }
                then.run(list.get(0));
            });
        }, () -> call.reject("Google Play unavailable"));
    }

    private interface ProductCallback { void run(ProductDetails details); }

    @PluginMethod
    public void getProduct(PluginCall call) {
        String id = call.getString("id", "");
        withProduct(id, call, (details) -> {
            JSObject ret = new JSObject();
            ret.put("id", details.getProductId());
            ProductDetails.OneTimePurchaseOfferDetails offer = details.getOneTimePurchaseOfferDetails();
            ret.put("price", offer != null ? offer.getFormattedPrice() : null);
            ret.put("title", details.getName());
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void isOwned(PluginCall call) {
        String id = call.getString("id", "");
        connect(() -> owned(id, (owned) -> {
            JSObject ret = new JSObject();
            ret.put("owned", owned);
            call.resolve(ret);
        }, () -> call.reject("query failed")), () -> call.reject("Google Play unavailable"));
    }

    // Restoring on Android is the same question: Google Play keeps the purchase with the player's account.
    @PluginMethod
    public void restore(PluginCall call) { isOwned(call); }

    @PluginMethod
    public void purchase(PluginCall call) {
        String id = call.getString("id", "");
        if (buying != null) { reply(buying, "cancelled"); buying = null; }
        withProduct(id, call, (details) -> {
            buying = call;
            List<BillingFlowParams.ProductDetailsParams> products = new ArrayList<>();
            products.add(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).build());
            BillingFlowParams params = BillingFlowParams.newBuilder().setProductDetailsParamsList(products).build();
            getActivity().runOnUiThread(() -> {
                BillingResult result = billing.launchBillingFlow(getActivity(), params);
                if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) finish("purchased");
                else if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) finish("error");
            });
        });
    }

    // Google Play's answer to a purchase (also for a pending payment that completes later, with no call waiting).
    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.OK && purchases != null) {
            String status = "error";
            for (Purchase p : purchases) {
                if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    acknowledge(p);
                    for (String id : p.getProducts()) notifyOwned(id, true);
                    status = "purchased";
                } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING && !"purchased".equals(status)) {
                    status = "pending";
                }
            }
            finish(status);
        } else if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            finish("cancelled");
        } else if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            finish("purchased");
        } else {
            finish("error");
        }
    }

    private void finish(String status) {
        if (buying == null) return;
        PluginCall call = buying;
        buying = null;
        reply(call, status);
    }

    private void reply(PluginCall call, String status) {
        JSObject ret = new JSObject();
        ret.put("status", status);
        call.resolve(ret);
    }

    private interface OwnedCallback { void run(boolean owned); }

    // Whether the player's Google account owns the product (completed purchases only); acknowledges any left over.
    private void owned(String id, OwnedCallback then, Runnable failed) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build();
        billing.queryPurchasesAsync(params, (result, list) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { failed.run(); return; }
            boolean owned = false;
            if (list != null) {
                for (Purchase p : list) {
                    if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || !p.getProducts().contains(id)) continue;
                    owned = true;
                    acknowledge(p);
                }
            }
            then.run(owned);
        });
    }

    private void acknowledge(Purchase p) {
        if (p.isAcknowledged()) return;
        AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build();
        billing.acknowledgePurchase(params, (result) -> { /* retried on the next isOwned if it failed */ });
    }

    private void notifyOwned(String id, boolean owned) {
        JSObject data = new JSObject();
        data.put("productId", id);
        data.put("owned", owned);
        notifyListeners("owned", data);
    }
}
