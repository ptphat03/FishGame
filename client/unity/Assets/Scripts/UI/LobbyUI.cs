using FishGame.Game;
using FishGame.Net;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace FishGame.UI
{
    /// <summary>
    /// Tự tìm và wire toàn bộ Lobby UI trong Awake().
    /// Đặt script này trên Canvas hoặc Managers (không bị xóa khi rebuild UI).
    /// </summary>
    public class LobbyUI : MonoBehaviour
    {
        [Header("Header (tự tìm nếu để trống)")]
        [SerializeField] private TMP_Text balanceText;
        [SerializeField] private TMP_Text usernameText;
        [SerializeField] private Button   logoutButton;

        [Header("Room list")]
        [SerializeField] private Transform  roomListParent;
        [SerializeField] private GameObject roomItemPrefab;

        [Header("Status")]
        [SerializeField] private TMP_Text statusText;

        private bool _connecting;

        private void Awake()
        {
            // ── Tự tìm components (dùng != null thay vì ?? cho Unity Objects) ─
            if (balanceText  == null) balanceText  = Deep<TMP_Text>("BalanceText");
            if (usernameText == null) usernameText = Deep<TMP_Text>("UsernameText");
            if (logoutButton == null) logoutButton = Deep<Button>("LogoutButton");
            if (statusText   == null) statusText   = Deep<TMP_Text>("StatusText");

            if (roomListParent == null)
            {
                var ct = DeepGO(Canvas()?.transform, "Content");
                if (ct != null) roomListParent = ct.transform;
            }

            // ── Wire onClick ──────────────────────────────────────────────────
            if (logoutButton != null)
            {
                logoutButton.onClick.RemoveAllListeners();
                logoutButton.onClick.AddListener(OnLogoutClicked);
            }

            // roomItemPrefab: tìm trong Resources nếu chưa gán
            if (roomItemPrefab == null)
                roomItemPrefab = Resources.Load<GameObject>("Prefabs/RoomItem");
        }

        private async void Start()
        {
            if (AuthManager.Instance == null || !AuthManager.Instance.IsLoggedIn)
            {
                SceneManager.LoadScene("LoginScene");
                return;
            }

            if (usernameText != null)
                usernameText.text = "Chao mung!";

            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted += OnSessionStarted;

            await LoadDataAsync();
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
                GameManager.Instance.OnSessionStarted -= OnSessionStarted;
        }

        // ── Data loading ──────────────────────────────────────────────────────

        private async System.Threading.Tasks.Task LoadDataAsync()
        {
            SetStatus("Dang tai...");

            var token = AuthManager.Instance.AccessToken;

            var walletTask = ApiClient.Instance.GetAsync<WalletApiResponse>("/api/wallet", token);
            var roomsTask  = ApiClient.Instance.GetAsync<RoomsApiResponse>("/api/rooms", token);

            await System.Threading.Tasks.Task.WhenAll(walletTask, roomsTask);

            var (wallet, walletErr) = walletTask.Result;
            var (rooms,  roomsErr)  = roomsTask.Result;

            if (walletErr != null) { SetStatus($"Loi tai vi: {walletErr}"); return; }
            if (roomsErr  != null) { SetStatus($"Loi tai phong: {roomsErr}"); return; }

            SetStatus("");
            if (wallet?.data != null) RefreshBalance(wallet.data.balance);
            BuildRoomList(rooms?.data);
        }

        private void RefreshBalance(long balance)
        {
            if (balanceText != null)
                balanceText.text = $"VND {balance:N0}";
        }

        // ── Room list ─────────────────────────────────────────────────────────

        private void BuildRoomList(RoomData[] rooms)
        {
            if (roomListParent == null) { SetStatus("Loi: khong tim thay Content"); return; }

            foreach (Transform child in roomListParent) Destroy(child.gameObject);

            if (rooms == null || rooms.Length == 0)
            {
                SetStatus("Khong co phong nao.");
                return;
            }

            if (roomItemPrefab == null) { SetStatus("Loi: chua gan RoomItem prefab"); return; }

            foreach (var room in rooms)
            {
                var item = Instantiate(roomItemPrefab, roomListParent);
                item.GetComponent<RoomItem>()?.Setup(room, () => OnJoinRoom(room.id));
            }
        }

        // ── Join room ─────────────────────────────────────────────────────────

        private async void OnJoinRoom(long roomId)
        {
            if (_connecting) return;
            _connecting = true;
            SetStatus("Dang ket noi...");

            try
            {
                if (AuthManager.Instance == null || GameManager.Instance == null || ApiClient.Instance == null)
                {
                    SetStatus("Loi: managers chua san sang");
                    return;
                }

                var token     = AuthManager.Instance.AccessToken;
                var serverUrl = ApiClient.Instance.BaseUrl
                    .Replace("5100", "8080")
                    .Replace("http", "ws")
                    + "/api/v1/ws";

                await GameManager.Instance.ConnectAsync(serverUrl, token);
                await GameManager.Instance.JoinRoomAsync(roomId);
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[LobbyUI] Join room failed: {ex.Message}");
                SetStatus($"Loi ket noi: {ex.Message}");
            }
            finally
            {
                _connecting = false;
            }
        }

        private void OnSessionStarted(int seatId)
        {
            Debug.Log($"[LobbyUI] Session started seat={seatId}");
            SceneManager.LoadScene("GameScene");
        }

        // ── Logout ────────────────────────────────────────────────────────────

        public void OnLogoutClicked()
        {
            if (AuthManager.Instance != null) AuthManager.Instance.Logout();
            SceneManager.LoadScene("LoginScene");
        }

        // ── Helper ────────────────────────────────────────────────────────────

        private void SetStatus(string msg)
        {
            if (statusText != null) statusText.text = msg;
        }

        // ── Auto-find ─────────────────────────────────────────────────────────

        static T Deep<T>(string name) where T : Component
        {
            var go = DeepGO(Canvas()?.transform, name);
            return go != null ? go.GetComponent<T>() : null;
        }

        static Canvas Canvas() => Object.FindObjectOfType<Canvas>();

        static GameObject DeepGO(Transform t, string name)
        {
            if (t == null) return null;
            if (t.name == name) return t.gameObject;
            foreach (Transform c in t) { var f = DeepGO(c, name); if (f != null) return f; }
            return null;
        }
    }
}
