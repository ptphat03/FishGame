using FishGame.Game;
using FishGame.Net;
using FishGame.Proto;
using FishGame.UI;
using UnityEngine;
using UnityEngine.InputSystem;

namespace FishGame.Game
{
    /// <summary>
    /// Handles cannon input, applies the Hero View transform, and fires shots.
    ///
    /// Coordinate pipeline on each tap/click:
    ///
    ///   1. Read LOCAL screen position of the touch/click.
    ///   2. Rotate the cannon sprite to aim at it (purely visual — stays in local space).
    ///   3. Convert to SERVER coords via HeroViewTransformer.ToServerCoords().
    ///   4. Calculate server-space angle via HeroViewTransformer.ToServerAngle().
    ///   5. Send ShootRequest with server coords + angle via GameManager.
    ///
    /// The cannon base is rendered at the LOCAL screen position returned by
    /// HeroViewTransformer.GetCannonLocalScreenX() so it always appears at the
    /// bottom of the player's screen regardless of seat assignment.
    ///
    /// Attach to the cannon root GameObject. Assign `cannonPivot` (the child
    /// that rotates) and `betAmount` in the Inspector.
    /// </summary>
    public class CannonController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Transform cannonPivot;  // child that rotates
        [SerializeField] private Camera    gameCamera;

        [Header("Gameplay")]
        [SerializeField] private float fireRatePerSecond = 3f;
        public long BetAmount = 10;

        private int   _seatId = -1;
        private float _lastFireTime;

        // ── Unity lifecycle ────────────────────────────────────────────────

        private void OnEnable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted += OnSessionStarted;
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted -= OnSessionStarted;
        }

        private void Start()
        {
            if (gameCamera == null)
                gameCamera = Camera.main;
        }

        private void Update()
        {
            if (_seatId < 0) return; // not in session yet

            var screenPos = GetPointerScreenPosition();
            if (screenPos == null) return;

            RotateCannonTowards(screenPos.Value);

            bool fired = GetPointerDown();
            if (fired && CanFire())
                Fire(screenPos.Value);
        }

        // ── Session handling ───────────────────────────────────────────────

        private void OnSessionStarted(int seatId)
        {
            _seatId = seatId;
            RepositionCannon();
        }

        /// <summary>
        /// Moves the cannon base to its local screen position based on seat ID.
        /// Uses HeroViewTransformer to get the correct X for this player.
        /// </summary>
        private void RepositionCannon()
        {
            float localX = HeroViewTransformer.GetCannonLocalScreenX(_seatId);
            float localY = HeroViewTransformer.GetCannonLocalScreenY();

            // Convert screen position to world position via the game camera
            Vector3 worldPos = gameCamera.ScreenToWorldPoint(
                new Vector3(localX, localY, gameCamera.nearClipPlane)
            );
            transform.position = new Vector3(worldPos.x, worldPos.y, transform.position.z);
        }

        // ── Firing ────────────────────────────────────────────────────────

        private bool CanFire() =>
            Time.time - _lastFireTime >= 1f / fireRatePerSecond;

        private void Fire(Vector2 localScreenPos)
        {
            _lastFireTime = Time.time;

            // ── Step 3: local screen → server world coords ─────────────────
            Vector2 serverPos = HeroViewTransformer.ToServerCoords(localScreenPos, _seatId);

            // ── Step 4: local aim angle → server angle ─────────────────────
            Vector2 cannonScreenPos = new Vector2(
                HeroViewTransformer.GetCannonLocalScreenX(_seatId),
                HeroViewTransformer.GetCannonLocalScreenY()
            );
            float localAngle = Vector2.SignedAngle(Vector2.up, localScreenPos - cannonScreenPos);
            float serverAngle = HeroViewTransformer.ToServerAngle(localAngle, _seatId);

            // ── Step 5: send ───────────────────────────────────────────────
            if (GameManager.Instance != null)
                _ = GameManager.Instance.ShootAsync(serverPos.x, serverPos.y, serverAngle, BetAmount);
        }

        // ── Visual: rotate cannon pivot towards pointer ────────────────────

        /// <summary>
        /// Rotates the cannon sprite in LOCAL screen space — purely cosmetic,
        /// no server coordinates involved here.
        /// </summary>
        private void RotateCannonTowards(Vector2 targetScreenPos)
        {
            if (cannonPivot == null) return;

            Vector3 targetWorld = gameCamera.ScreenToWorldPoint(
                new Vector3(targetScreenPos.x, targetScreenPos.y, gameCamera.nearClipPlane)
            );
            Vector2 direction = (Vector2)(targetWorld - cannonPivot.position);
            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg - 90f;
            cannonPivot.rotation = Quaternion.Euler(0f, 0f, angle);
        }

        // ── Other-player broadcasts ────────────────────────────────────────

        /// <summary>
        /// Renders a broadcast shoot from another player.
        /// The position arrives in SERVER space → must convert to LOCAL screen.
        /// </summary>
        public void PlayBroadcastShoot(BroadcastShootEvent ev)
        {
            Vector2 serverPos = new Vector2(ev.PosX, ev.PosY);
            Vector2 localPos  = HeroViewTransformer.ToLocalScreen(serverPos, _seatId);
            // TODO: instantiate a bullet VFX at localPos travelling at ev.Angle
        }

        // ── Input abstraction (works for both mouse and touch) ─────────────

        private static Vector2? GetPointerScreenPosition()
        {
#if ENABLE_INPUT_SYSTEM
            if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.isPressed)
                return Touchscreen.current.primaryTouch.position.ReadValue();
            if (Mouse.current != null)
                return Mouse.current.position.ReadValue();
            return null;
#else
            if (Input.touchCount > 0) return Input.GetTouch(0).position;
            return Input.mousePresent ? (Vector2?)Input.mousePosition : null;
#endif
        }

        private static bool GetPointerDown()
        {
#if ENABLE_INPUT_SYSTEM
            if (Touchscreen.current != null)
                return Touchscreen.current.primaryTouch.press.wasPressedThisFrame;
            return Mouse.current?.leftButton.wasPressedThisFrame ?? false;
#else
            return Input.GetMouseButtonDown(0) || (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began);
#endif
        }
    }
}
