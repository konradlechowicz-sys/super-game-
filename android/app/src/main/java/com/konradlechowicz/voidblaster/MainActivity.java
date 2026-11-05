package com.konradlechowicz.voidblaster;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // the game's own native plugins, registered before Capacitor starts: the full-game purchase (Google Play Billing)
        // and the Endless leaderboards (Google Play Games)
        registerPlugin(StorePlugin.class);
        registerPlugin(PlayGamesPlugin.class);
        super.onCreate(savedInstanceState);
        immersive();
        // The back button asks the game (js/main.js app.handleBack): it skips a story scene, closes a pop-up, pauses a
        // run or goes one screen back. At the main menu it answers false and the app goes to the background.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView web = getBridge() != null ? getBridge().getWebView() : null;
                if (web == null) { moveTaskToBack(true); return; }
                web.evaluateJavascript("(window.__app && window.__app.handleBack) ? window.__app.handleBack() : false", (result) -> {
                    if (!"true".equals(result)) moveTaskToBack(true);
                });
            }
        });
    }

    // Full screen like other games: the status bar and the navigation bar hidden; a swipe from the edge shows them for a
    // moment. Applied again whenever the game comes back to the front (after a notification, the home screen, a call).
    private void immersive() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.hide(WindowInsetsCompat.Type.systemBars());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }
}
