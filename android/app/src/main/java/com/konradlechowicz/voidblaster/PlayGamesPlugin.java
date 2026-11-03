package com.konradlechowicz.voidblaster;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.tasks.Task;

/**
 * The Endless leaderboards on Android: Google Play Games (Play Games Services v2) behind the same "VoidGameCenter"
 * plugin as Game Center on iOS (ios/App/App/GameCenterPlugin.swift), so js/leaderboard.js works unchanged:
 * signIn, submitScore, showLeaderboard. Off until the game's Play Games project id is in
 * res/values/strings.xml (game_services_project_id, from Play Console → Play Games Services → Configuration).
 */
@CapacitorPlugin(name = "VoidGameCenter")
public class PlayGamesPlugin extends Plugin {
    private boolean ready = false;

    @Override
    public void load() {
        int res = getContext().getResources().getIdentifier("game_services_project_id", "string", getContext().getPackageName());
        String id = res != 0 ? getContext().getString(res) : "";
        if (id.trim().isEmpty()) return;
        PlayGamesSdk.initialize(getContext());
        ready = true;
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (!ready) { signedIn(call, false); return; }
        getActivity().runOnUiThread(() -> PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener((t) -> {
            if (t.isSuccessful() && t.getResult().isAuthenticated()) { signedIn(call, true); return; }
            // not signed in automatically: Google's sign-in screen
            PlayGames.getGamesSignInClient(getActivity()).signIn().addOnCompleteListener((s) ->
                signedIn(call, s.isSuccessful() && s.getResult().isAuthenticated()));
        }));
    }

    private void signedIn(PluginCall call, boolean ok) {
        JSObject ret = new JSObject();
        ret.put("signedIn", ok);
        call.resolve(ret);
    }

    @PluginMethod
    public void submitScore(PluginCall call) {
        String id = call.getString("leaderboardId");
        Integer score = call.getInt("score");
        if (id == null || score == null) { call.reject("Missing leaderboard id or score"); return; }
        if (!ready) { submitted(call, false); return; }
        getActivity().runOnUiThread(() -> PlayGames.getLeaderboardsClient(getActivity()).submitScoreImmediate(id, score)
            .addOnCompleteListener((t) -> submitted(call, t.isSuccessful())));
    }

    private void submitted(PluginCall call, boolean ok) {
        JSObject ret = new JSObject();
        ret.put("submitted", ok);
        call.resolve(ret);
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        if (!ready) { call.resolve(); return; }
        String id = call.getString("leaderboardId");
        getActivity().runOnUiThread(() -> {
            Task<Intent> screen = id != null
                ? PlayGames.getLeaderboardsClient(getActivity()).getLeaderboardIntent(id)
                : PlayGames.getLeaderboardsClient(getActivity()).getAllLeaderboardsIntent();
            screen.addOnSuccessListener((intent) -> getActivity().startActivityForResult(intent, 9004));
            call.resolve();
        });
    }
}
