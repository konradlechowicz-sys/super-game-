package com.konradlechowicz.voidblaster;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
}
