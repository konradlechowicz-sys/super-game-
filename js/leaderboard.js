// Leaderboards (v1.3): one Endless leaderboard per world, score = kills. Backend: Game Center through the native
// "VoidGameCenter" plugin (ios/App/App/GameCenterPlugin.swift). On the web and on Android (until Google Play Games)
// every call does nothing and the game shows no leaderboard button.
// The ids below must match the leaderboards set up in App Store Connect (Game Center, Classic, high score first).
export const leaderboardId = (worldId) => `com.konradlechowicz.voidblaster.endless.w${worldId}`;

export function createLeaderboard(app) {
  const gc = app.native?.GameCenter || null;
  const lb = {
    available: !!gc,
    signedIn: false,
    // Sign in to Game Center; Apple shows its own sign-in screen the first time.
    async signIn() {
      if (!gc || lb.signedIn) return lb.signedIn;
      try { lb.signedIn = !!(await gc.signIn()).signedIn; } catch { lb.signedIn = false; }
      return lb.signedIn;
    },
    async submit(worldId, kills) {
      if (!gc || kills <= 0) return;
      if (!(await lb.signIn())) return;
      gc.submitScore({ leaderboardId: leaderboardId(worldId), score: kills }).catch(() => {});
    },
    async show(worldId) {
      if (!gc) return;
      await lb.signIn();
      gc.showLeaderboard(worldId ? { leaderboardId: leaderboardId(worldId) } : {}).catch(() => {});
    },
  };
  return lb;
}
