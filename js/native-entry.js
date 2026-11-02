// Entry point for the iOS and Android app builds (bundled by scripts/build.mjs).
// Exposes the Capacitor plugins on window.__native before the game boots.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

// In-app purchase bridge implemented in ios/App/App/StorePlugin.swift (StoreKit 2).
const Store = registerPlugin('VoidStore');
// Game Center bridge (leaderboards) implemented in ios/App/App/GameCenterPlugin.swift.
const GameCenter = registerPlugin('VoidGameCenter');

// The same "VoidStore" plugin on Android: Google Play Billing (android/app/src/main/java/.../StorePlugin.java).
// Leaderboards on Android wait for Google Play Games.
const platform = Capacitor.getPlatform();
const ios = platform === 'ios';
const store = ios || platform === 'android' ? Store : null;
window.__native = Capacitor.isNativePlatform() ? { platform, Haptics, ImpactStyle, NotificationType, Preferences, Store: store, GameCenter: ios ? GameCenter : null } : null;
