// Entry point for the iOS app build only (bundled by scripts/build.mjs).
// Exposes the Capacitor plugins on window.__native before the game boots.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

// In-app purchase bridge implemented in ios/App/App/StorePlugin.swift (StoreKit 2).
const Store = registerPlugin('VoidStore');

window.__native = Capacitor.isNativePlatform() ? { Haptics, ImpactStyle, NotificationType, Preferences, Store } : null;
