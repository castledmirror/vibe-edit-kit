/** Platform UI keep-out zones for 1080x1920 vertical (TikTok / Reels / Shorts).
 *  Conservative union of all three so one render is safe everywhere. */
export const SAFE = {
  top: 130,        // status bar / "Following · For You"
  bottom: 360,     // username, caption, audio ticker
  left: 60,
  right: 180,      // like / comment / share action rail
  rail: {top: 1020, bottom: 1780},
  /** Band reserved for burned-in captions: clear of the card and the platform UI. */
  captions: {top: 1590, bottom: 1750},
};
export const SAFE_BOTTOM_Y = 1920 - SAFE.bottom; // 1560 — nothing critical below this
