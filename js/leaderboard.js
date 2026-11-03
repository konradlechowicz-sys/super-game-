// Leaderboards (v1.3): one Endless leaderboard per world, score = kills. Backend: the native "VoidGameCenter" plugin,
// Game Center on iOS (ios/App/App/GameCenterPlugin.swift) and Google Play Games on Android
// (android/app/src/main/java/.../PlayGamesPlugin.java). On the web every call does nothing and the game shows no
// leaderboard button; on Android too until the Play Games ids below are filled in.
// iOS: the ids set up in App Store Connect (Game Center, Classic, high score first).
const APPLE_ID = (worldId) => `com.konradlechowicz.voidblaster.endless.w${worldId}`;
// Android: the ids Play Console gives each leaderboard (Play Games Services → Leaderboards), world -> id.
export const PLAY_IDS = {};
const android = () => globalThis.__native?.platform === 'android';
export const leaderboardId = (worldId) => (android() ? PLAY_IDS[worldId] : APPLE_ID(worldId));

export function createLeaderboard(app) {
  const gc = app.native?.GameCenter || null;
  const lb = {
    available: !!gc && (app.native?.platform !== 'android' || Object.keys(PLAY_IDS).length > 0),
    signedIn: false,
    // Sign in to Game Center; Apple shows its own sign-in screen the first time.
    async signIn() {
      if (!lb.available || lb.signedIn) return lb.signedIn;
      try { lb.signedIn = !!(await gc.signIn()).signedIn; } catch { lb.signedIn = false; }
      return lb.signedIn;
    },
    async submit(worldId, kills) {
      if (!lb.available || kills <= 0 || !leaderboardId(worldId)) return;
      if (!(await lb.signIn())) return;
      gc.submitScore({ leaderboardId: leaderboardId(worldId), score: kills }).catch(() => {});
    },
    async show(worldId) {
      if (!lb.available) return;
      await lb.signIn();
      gc.showLeaderboard(worldId ? { leaderboardId: leaderboardId(worldId) } : {}).catch(() => {});
    },
  };
  return lb;
}
