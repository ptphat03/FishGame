using System.Collections;
using System.Collections.Generic;
using FishGame.Game;
using FishGame.Net;
using FishGame.Proto;
using FishGame.UI;
using UnityEngine;

namespace FishGame.Game
{
    /// <summary>
    /// Listens to MessageRouter events and manages the fish lifecycle on screen.
    ///
    /// Spawn flow:
    ///   1. Server sends SpawnFishEvent with server-world path coordinates.
    ///   2. FishSpawner converts each waypoint via HeroViewTransformer.ToLocalScreen().
    ///   3. Instantiates a FishAgent prefab and starts its path coroutine.
    ///   4. Registers the instance in _aliveFish so collision detection can find it.
    ///
    /// Kill flow:
    ///   - BroadcastKillEvent (other player killed) → play explosion VFX, remove from map.
    ///   - HitResultEvent with Killed=true (this player killed) → same, plus reward is
    ///     already handled by GameManager.
    ///   - Duration expired → quietly despawn.
    /// </summary>
    public class FishSpawner : MonoBehaviour
    {
        [Header("Prefabs / Resources")]
        [Tooltip("Default fish prefab. Override per-fishId with specific entries.")]
        [SerializeField] private GameObject defaultFishPrefab;

        [Tooltip("VFX prefab played on kill/despawn.")]
        [SerializeField] private GameObject explosionVfxPrefab;

        [Header("Path definitions")]
        [Tooltip("Array of path configs indexed by PathId (1-based).")]
        [SerializeField] private FishPath[] paths;

        // instanceId → live fish GameObject
        private readonly Dictionary<string, FishAgent> _aliveFish = new Dictionary<string, FishAgent>();

        private int _seatId = -1;

        // ── Unity lifecycle ────────────────────────────────────────────────

        private void OnEnable()
        {
            var router = MessageRouter.Instance;
            if (router == null) return;
            router.OnSpawnFish      += OnSpawnFish;
            router.OnBroadcastKill  += OnBroadcastKill;
            router.OnHitResult      += OnHitResult;

            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted += OnGameSessionStarted;
        }

        private void OnDisable()
        {
            var router = MessageRouter.Instance;
            if (router == null) return;
            router.OnSpawnFish      -= OnSpawnFish;
            router.OnBroadcastKill  -= OnBroadcastKill;
            router.OnHitResult      -= OnHitResult;

            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted -= OnGameSessionStarted;
        }

        private void OnGameSessionStarted(int seatId) => _seatId = seatId;

        // ── Event handlers ─────────────────────────────────────────────────

        private void OnSpawnFish(SpawnFishEvent ev)
        {
            if (_aliveFish.ContainsKey(ev.InstanceId)) return; // duplicate guard

            int pathIndex = Mathf.Clamp((int)ev.PathId - 1, 0, paths.Length - 1);
            FishPath path = paths[pathIndex];

            // Convert server-world waypoints to local screen space for this seat
            Vector2[] localWaypoints = new Vector2[path.serverWaypoints.Length];
            for (int i = 0; i < path.serverWaypoints.Length; i++)
                localWaypoints[i] = HeroViewTransformer.ToLocalScreen(path.serverWaypoints[i], _seatId);

            GameObject prefab = defaultFishPrefab;
            if (prefab == null)
            {
                Debug.LogWarning("[FishSpawner] No fish prefab assigned");
                return;
            }

            var go = Instantiate(prefab, localWaypoints[0], Quaternion.identity, transform);
            var agent = go.GetComponent<FishAgent>() ?? go.AddComponent<FishAgent>();
            agent.Init(ev, localWaypoints, (int)ev.Speed, this);

            _aliveFish[ev.InstanceId] = agent;
        }

        private void OnBroadcastKill(BroadcastKillEvent ev) =>
            KillFish(ev.InstanceId);

        private void OnHitResult(HitResultEvent ev)
        {
            // Only remove if killed — HitResultEvent fires even for misses
            if (ev.Killed)
                KillFish(ev.InstanceId);
        }

        // ── Public API called by FishAgent ─────────────────────────────────

        /// <summary>Called by FishAgent when its click collider is hit.</summary>
        public void OnFishTapped(FishAgent agent)
        {
            if (GameManager.Instance != null)
                _ = GameManager.Instance.HitFishAsync((int)agent.FishId, agent.InstanceId);
        }

        /// <summary>Called by FishAgent when its lifetime expires.</summary>
        public void OnFishExpired(string instanceId) =>
            RemoveFish(instanceId, playVfx: false);

        // ── Internal ────────────────────────────────────────────────────────

        private void KillFish(string instanceId) =>
            RemoveFish(instanceId, playVfx: true);

        private void RemoveFish(string instanceId, bool playVfx)
        {
            if (!_aliveFish.TryGetValue(instanceId, out var agent)) return;
            _aliveFish.Remove(instanceId);

            if (playVfx && explosionVfxPrefab != null)
                Instantiate(explosionVfxPrefab, agent.transform.position, Quaternion.identity);

            Destroy(agent.gameObject);
        }
    }

    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Moves a fish along local-screen waypoints and notifies FishSpawner
    /// when tapped or expired.
    /// </summary>
    public class FishAgent : MonoBehaviour
    {
        public long   FishId     { get; private set; }
        public string InstanceId { get; private set; }

        private Vector2[]   _waypoints;
        private float       _speed;
        private FishSpawner _spawner;
        private float       _expireAt;

        public void Init(SpawnFishEvent ev, Vector2[] localWaypoints, float speed, FishSpawner spawner)
        {
            FishId     = ev.FishId;
            InstanceId = ev.InstanceId;
            _waypoints = localWaypoints;
            _speed     = Mathf.Max(speed, 1f);
            _spawner   = spawner;
            _expireAt  = Time.time + ev.Duration;
            StartCoroutine(FollowPath());
        }

        private IEnumerator FollowPath()
        {
            Camera cam = Camera.main;
            if (cam == null) { _spawner.OnFishExpired(InstanceId); yield break; }

            for (int i = 0; i < _waypoints.Length; i++)
            {
                Vector3 targetWorld = cam.ScreenToWorldPoint(
                    new Vector3(_waypoints[i].x, _waypoints[i].y, cam.nearClipPlane)
                );
                targetWorld.z = transform.position.z;

                while (Vector3.Distance(transform.position, targetWorld) > 0.05f)
                {
                    if (Time.time >= _expireAt)
                    {
                        _spawner.OnFishExpired(InstanceId);
                        yield break;
                    }
                    transform.position = Vector3.MoveTowards(
                        transform.position, targetWorld, _speed * Time.deltaTime
                    );
                    yield return null;
                }
            }
            _spawner.OnFishExpired(InstanceId);
        }

        private void OnMouseDown() => _spawner.OnFishTapped(this);
    }

    // ────────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Designer-configured path for fish movement.
    /// `serverWaypoints` are in SERVER-WORLD space; FishSpawner converts them.
    /// </summary>
    [System.Serializable]
    public class FishPath
    {
        [Tooltip("Waypoints in server-world space (bottom-player perspective).")]
        public Vector2[] serverWaypoints = {
            new Vector2(1920, 540),   // enter from right
            new Vector2(  0,  540),   // exit left
        };
    }
}
