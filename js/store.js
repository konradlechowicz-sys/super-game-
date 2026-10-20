// Full-game unlock: one non-consumable in-app purchase.
// Free trial = world 1 (with its boss), the Striker and shop upgrades up to level FREE_SHOP_CAP.
// The purchase unlocks worlds 2-4, the Phantom and Titan, every upgrade level, plus a welcome bonus.
//
// Backends: the iOS app talks to StoreKit through the native "VoidStore" plugin (ios/App/App/StorePlugin.swift);
// the browser preview with ?dev simulates the purchase for testing; any other browser is trial-only.

export const FULL_GAME_ID = 'com.konradlechowicz.voidblaster.fullgame';
export const FREE_SHOP_CAP = 3;
export const UNLOCK_COINS = 1000;
export const FULL_GAME_SHIPS = ['phantom', 'titan'];

export function createStore(app, dev) {
  const native = app.native?.Store || null;
  const store = {
    // 'native' | 'dev' | 'none'
    mode: native ? 'native' : dev ? 'dev' : 'none',
    price: native ? null : dev ? '$3.99' : null,
    busy: false,
  };

  store.isFull = () => !!app.save.fullGame;

  // Grants everything the purchase includes. The coin bonus is paid once per save.
  store.grant = () => {
    const s = app.save;
    const fresh = !s.fullGame;
    s.fullGame = true;
    for (const id of FULL_GAME_SHIPS) if (!s.ships.includes(id)) s.ships.push(id);
    if (!s.skins.includes('gold')) s.skins.push('gold');
    if (!s.unlockBonus) {
      s.unlockBonus = true;
      s.coins += UNLOCK_COINS;
    }
    app.persist();
    return fresh;
  };

  // A refunded purchase disappears from StoreKit's entitlements; take the full game back, keep progress and coins.
  store.revoke = () => {
    const s = app.save;
    if (!s.fullGame) return;
    s.fullGame = false;
    if (s.skin === 'gold') s.skin = null;
    s.ships = s.ships.filter((id) => !FULL_GAME_SHIPS.includes(id));
    if (!s.ships.includes(s.ship)) s.ship = 'striker';
    app.persist();
  };

  store.init = async () => {
    // The public web version is trial-only: a save unlocked earlier (e.g. by a test flag) goes back to the trial.
    if (store.mode === 'none') { store.revoke(); return; }
    if (!native) return;
    try {
      const p = await native.getProduct({ id: FULL_GAME_ID });
      store.price = p.price;
    } catch { /* store unreachable (offline, or product not set up yet) */ }
    try {
      const { owned } = await native.isOwned({ id: FULL_GAME_ID });
      if (owned) store.grant();
      else store.revoke();
    } catch { /* keep the saved state when StoreKit cannot answer */ }
    native.addListener('owned', (e) => {
      if (e.productId !== FULL_GAME_ID) return;
      if (e.owned) { store.grant(); app.onFullGameChanged?.(); } else { store.revoke(); app.onFullGameChanged?.(); }
    });
  };

  // Resolves to 'purchased' | 'cancelled' | 'pending' | 'unavailable' | 'error'
  store.buy = async () => {
    if (store.busy) return 'busy';
    store.busy = true;
    try {
      if (store.mode === 'dev') { store.grant(); return 'purchased'; }
      if (!native) return 'unavailable';
      const { status } = await native.purchase({ id: FULL_GAME_ID });
      if (status === 'purchased') store.grant();
      return status;
    } catch {
      return 'error';
    } finally {
      store.busy = false;
    }
  };

  // Resolves to true when the full game is owned after restoring.
  store.restore = async () => {
    if (store.mode === 'dev') return store.isFull();
    if (!native) return false;
    try {
      const { owned } = await native.restore({ id: FULL_GAME_ID });
      if (owned) store.grant();
      return owned;
    } catch {
      return false;
    }
  };

  return store;
}

// The look of the selected ship, with an owned cosmetic skin applied.
export function shipLook(ship, save) {
  if (ship.id === 'striker' && save.skin === 'gold' && save.skins.includes('gold')) return { ...ship, color: '#ffd23d', skinName: 'Gold' };
  return ship;
}
