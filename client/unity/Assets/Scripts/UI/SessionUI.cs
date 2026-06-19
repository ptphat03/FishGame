using FishGame.Game;
using FishGame.Net;
using FishGame.Proto;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace FishGame.UI
{
    /// <summary>
    /// Wires GameManager events to the in-game HUD.
    /// Handles session end panel, disconnect, and back-to-lobby navigation.
    /// </summary>
    public class SessionUI : MonoBehaviour
    {
        [Header("HUD")]
        [SerializeField] private TMP_Text balanceText;
        [SerializeField] private TMP_Text earnText;
        [SerializeField] private TMP_Text fishKilledText;
        [SerializeField] private TMP_Text seatIdText;
        [SerializeField] private TMP_Text betAmountText;

        [Header("Session End Panel")]
        [SerializeField] private GameObject sessionEndPanel;
        [SerializeField] private TMP_Text   sessionEndSummaryText;

        [Header("Error Panel")]
        [SerializeField] private GameObject errorPanel;
        [SerializeField] private TMP_Text   errorText;

        private void Awake()
        {
            // ── Tự tìm HUD components (dùng != null thay vì ?? cho Unity Objects) ─
            var hud = DeepGO(Canvas()?.transform, "GameHUD");
            if (balanceText    == null) balanceText    = Deep<TMP_Text>(hud, "BalanceText");
            if (fishKilledText == null) fishKilledText = Deep<TMP_Text>(hud, "FishKilledText");
            if (earnText       == null) earnText       = Deep<TMP_Text>(hud, "EarnText");
            if (seatIdText     == null) seatIdText     = Deep<TMP_Text>(hud, "SeatIdText");

            var betUI = DeepGO(Canvas()?.transform, "BetUI");
            if (betAmountText  == null) betAmountText  = Deep<TMP_Text>(betUI, "BetAmountText");

            // ── Tự tìm panels ─────────────────────────────────────────────────
            if (sessionEndPanel == null) sessionEndPanel = DeepGO(Canvas()?.transform, "SessionEndPanel");
            if (sessionEndSummaryText == null)
                sessionEndSummaryText = Deep<TMP_Text>(sessionEndPanel, "EarnLabel");

            if (errorPanel == null) errorPanel = DeepGO(Canvas()?.transform, "ErrorPanel");
            if (errorText  == null) errorText  = Deep<TMP_Text>(errorPanel, "ErrorMessage");

            // ── Wire back buttons ─────────────────────────────────────────────
            Wire(Deep<UnityEngine.UI.Button>(sessionEndPanel, "BackToLobbyButton"), OnBackToLobbyClicked);
            Wire(Deep<UnityEngine.UI.Button>(errorPanel,      "ErrorBackButton"),   OnErrorBackClicked);
        }

        private void Start()
        {
            var gm = GameManager.Instance;
            if (gm == null || !gm.InSession) return;

            // Session đã bắt đầu ở LobbyScene, event đã fire trước khi scene này load
            // → tự refresh HUD từ GameManager state
            OnSessionStarted(gm.SeatId);

            // NotifyReady phải gọi ở đây (GameScene đã load) chứ không phải LobbyScene
            // Tránh server gửi fish trước khi scene sẵn sàng
            _ = gm.NotifyReadyAsync();
        }

        private void OnEnable()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;
            gm.OnBalanceChanged += RefreshBalance;
            gm.OnSessionStarted += OnSessionStarted;
            gm.OnHitResult      += OnHitResult;
            gm.OnSessionEnded   += OnSessionEnded;
            gm.OnDisconnected   += OnDisconnected;
            gm.OnError          += OnError;
        }

        private void OnDisable()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;
            gm.OnBalanceChanged -= RefreshBalance;
            gm.OnSessionStarted -= OnSessionStarted;
            gm.OnHitResult      -= OnHitResult;
            gm.OnSessionEnded   -= OnSessionEnded;
            gm.OnDisconnected   -= OnDisconnected;
            gm.OnError          -= OnError;
        }

        // ── GameManager event handlers ────────────────────────────────────────

        private void OnSessionStarted(int seatId)
        {
            if (sessionEndPanel != null) sessionEndPanel.SetActive(false);
            if (errorPanel      != null) errorPanel.SetActive(false);
            if (seatIdText      != null) seatIdText.text = $"Seat {seatId}";
            RefreshAll();
        }

        private void RefreshBalance(long balance)
        {
            if (balanceText != null)
                balanceText.text = $"VND {balance:N0}";
        }

        private void OnHitResult(HitResultEvent ev)
        {
            if (!ev.Killed) return;
            if (earnText      != null) earnText.text      = $"+{ev.Earn:N0}  (tổng {ev.TotalEarn:N0})";
            if (fishKilledText != null) fishKilledText.text = $"Ca: {ev.FishKilled}";
        }

        private void OnSessionEnded(SessionEndedEvent ev)
        {
            if (sessionEndPanel == null) return;
            sessionEndPanel.SetActive(true);

            if (sessionEndSummaryText != null)
            {
                long   net  = ev.TotalEarn - ev.TotalSpend;
                string sign = net >= 0 ? "+" : "";
                sessionEndSummaryText.text =
                    $"Kết thúc!\n\n" +
                    $"Cá đã bắn :  {ev.FishKilled}\n" +
                    $"Lần bắn   :  {ev.ShotsFired}\n" +
                    $"Thu được  :  {ev.TotalEarn:N0}\n" +
                    $"Chi tiêu  :  {ev.TotalSpend:N0}\n" +
                    $"Net       :  {sign}{net:N0}\n" +
                    $"Số dư     :  {ev.FinalBalance:N0}";
            }
        }

        private void OnDisconnected()
        {
            ShowError("Mất kết nối với server.");
        }

        private void OnError(string code)
        {
            ShowError($"Lỗi: {code}");
        }

        // ── Bet amount (gọi từ CannonController hoặc BetUI) ───────────────────

        public void RefreshBetAmount(long bet)
        {
            if (betAmountText != null)
                betAmountText.text = $"Cược: {bet:N0}";
        }

        // ── Button callbacks (wire trong Inspector) ───────────────────────────

        public async void OnBackToLobbyClicked()
        {
            var gm = GameManager.Instance;
            if (gm != null && gm.InSession)
                await gm.LeaveRoomAsync();

            SceneManager.LoadScene("LobbyScene");
        }

        public void OnErrorBackClicked()
        {
            SceneManager.LoadScene("LobbyScene");
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private void RefreshAll()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;
            RefreshBalance(gm.Balance);
            if (fishKilledText != null) fishKilledText.text = $"Ca: {gm.FishKilled}";
            if (earnText       != null) earnText.text       = $"+{gm.TotalEarn:N0}";
        }

        private void ShowError(string msg)
        {
            if (errorPanel != null)
            {
                errorPanel.SetActive(true);
                if (errorText != null) errorText.text = msg;
            }
            if (sessionEndPanel != null) sessionEndPanel.SetActive(false);
        }

        // ── Auto-find helpers ─────────────────────────────────────────────────

        static void Wire(UnityEngine.UI.Button btn, UnityEngine.Events.UnityAction action)
        {
            if (btn == null) return;
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }

        static T Deep<T>(GameObject root, string name) where T : Component
        {
            if (root == null) return null;
            var go = DeepGO(root.transform, name);
            return go != null ? go.GetComponent<T>() : null;
        }

        static Canvas Canvas() => Object.FindObjectOfType<Canvas>();

        static GameObject DeepGO(Transform t, string name)
        {
            if (t == null || name == null) return null;
            if (t.name == name) return t.gameObject;
            foreach (Transform c in t) { var f = DeepGO(c, name); if (f != null) return f; }
            return null;
        }
    }
}
