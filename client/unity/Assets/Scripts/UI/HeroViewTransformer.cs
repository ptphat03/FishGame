using UnityEngine;

namespace FishGame.UI
{
    /// <summary>
    /// Hero View — every player always sees their own cannon at the bottom of the screen.
    ///
    /// ┌─────────────────────────────────────────────┐
    /// │  Seat 2 (top-left)     Seat 3 (top-right)   │  ← top players in SERVER space
    /// │      ▲                      ▲               │
    /// │      │  fish swim this way  │               │
    /// │      │                      │               │
    /// │  Seat 0 (bottom-left)  Seat 1 (bottom-right)│  ← bottom players in SERVER space
    /// └─────────────────────────────────────────────┘
    ///
    /// Bottom seats (0, 1) — no transform.
    ///   Server coords == screen coords.
    ///
    /// Top seats (2, 3) — 180° rotation around the screen centre.
    ///   screenPos.x = Screen.width  - serverPos.x
    ///   screenPos.y = Screen.height - serverPos.y
    ///
    /// Because rotating 180° is its own inverse, the same formula converts
    /// local screen coords BACK to server coords, which keeps the two methods
    /// (ToScreen, ToServer) identical for top seats.
    ///
    /// Cannon layout:
    ///   Seat 0 → server X = 40 %, LOCAL screen X = 40 %
    ///   Seat 1 → server X = 60 %, LOCAL screen X = 60 %
    ///   Seat 2 → server X = 60 %, LOCAL screen X = 40 %  (mirrored by 180° flip)
    ///   Seat 3 → server X = 40 %, LOCAL screen X = 60 %  (mirrored by 180° flip)
    ///   All cannons → server/local Y = 0 (bottom) / Screen.height (top)
    /// </summary>
    public static class HeroViewTransformer
    {
        // Server-world X ratios for each seat (bottom-player perspective).
        private static readonly float[] ServerCannonXRatios = { 0.4f, 0.6f, 0.6f, 0.4f };

        // ── Coordinate transforms ──────────────────────────────────────────

        /// <summary>
        /// Converts a SERVER-SPACE position to the LOCAL screen position that
        /// this seat's player sees.
        ///
        /// Bottom seats: identity.
        /// Top    seats: (Screen.width - x, Screen.height - y)
        /// </summary>
        public static Vector2 ToLocalScreen(Vector2 serverPos, int seatId)
        {
            if (seatId < 2) return serverPos;

            return new Vector2(
                Screen.width  - serverPos.x,  //  ← the 180° flip formula
                Screen.height - serverPos.y   //    specified in requirements
            );
        }

        /// <summary>
        /// Converts a LOCAL screen position (e.g. a touch point) to the
        /// SERVER-SPACE position that must be sent in a ShootRequest.
        ///
        /// The 180° rotation is its own inverse, so the formula is identical
        /// to ToLocalScreen — but named separately for readability.
        /// </summary>
        public static Vector2 ToServerCoords(Vector2 localScreenPos, int seatId)
        {
            if (seatId < 2) return localScreenPos;

            return new Vector2(
                Screen.width  - localScreenPos.x,
                Screen.height - localScreenPos.y
            );
        }

        // ── Angle transforms ───────────────────────────────────────────────

        /// <summary>
        /// Converts a LOCAL aim angle to the SERVER angle that must be sent in
        /// a ShootRequest. Top seats add 180° so the bullet travels the correct
        /// direction in server space.
        /// </summary>
        public static float ToServerAngle(float localAngle, int seatId) =>
            seatId < 2 ? localAngle : localAngle + 180f;

        /// <summary>
        /// Converts a SERVER broadcast angle (from another player's shot) into
        /// the LOCAL angle to use when rendering the bullet on screen.
        /// </summary>
        public static float ToLocalAngle(float serverAngle, int seatId) =>
            seatId < 2 ? serverAngle : serverAngle + 180f;

        // ── Cannon position helpers ────────────────────────────────────────

        /// <summary>
        /// Returns the LOCAL screen X (pixels) where this seat's cannon sprite
        /// should be placed. Always appears at 40 % (seats 0 & 2) or 60 %
        /// (seats 1 & 3) of the player's own screen.
        /// </summary>
        public static float GetCannonLocalScreenX(int seatId)
        {
            // Local view: 0&2 → 40%, 1&3 → 60%
            float ratio = (seatId == 0 || seatId == 2) ? 0.4f : 0.6f;
            return Screen.width * ratio;
        }

        /// <summary>
        /// Returns the LOCAL screen Y for the cannon: always the bottom row (0).
        /// Regardless of seat, the player's own cannon appears at the bottom.
        /// </summary>
        public static float GetCannonLocalScreenY() => 0f;

        /// <summary>
        /// Returns the SERVER-WORLD X position of this seat's cannon.
        /// Used when registering the cannon position with the server.
        /// </summary>
        public static float GetCannonServerX(int seatId) =>
            Screen.width * ServerCannonXRatios[Mathf.Clamp(seatId, 0, 3)];

        /// <summary>
        /// Returns the SERVER-WORLD Y position of this seat's cannon.
        /// Bottom seats → 0 (bottom edge), top seats → Screen.height (top edge).
        /// </summary>
        public static float GetCannonServerY(int seatId) =>
            seatId < 2 ? 0f : Screen.height;

        // ── Convenience ────────────────────────────────────────────────────

        /// <summary>True for seats that look "upward" in server space.</summary>
        public static bool IsTopSeat(int seatId) => seatId >= 2;
    }
}
