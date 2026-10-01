export const INTRO_KEY = "shiv-intro-seen";

// Private browsing and blocked site data can make sessionStorage throw on
// access; the intro then simply plays every time.
export function sessionStore() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function hasSeenIntro(storage) {
  try {
    return storage?.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(storage) {
  try {
    storage?.setItem(INTRO_KEY, "1");
  } catch {
    // ignore
  }
}
