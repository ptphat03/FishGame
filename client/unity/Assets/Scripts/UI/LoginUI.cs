using System.Threading.Tasks;
using FishGame.Net;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace FishGame.UI
{
    /// <summary>
    /// Tự tìm và wire toàn bộ UI trong Awake() — không cần kéo thả Inspector.
    /// Đặt script này trên Canvas hoặc Managers GameObject (không bị xóa khi rebuild).
    /// </summary>
    public class LoginUI : MonoBehaviour
    {
        [Header("Panels (tự tìm nếu để trống)")]
        [SerializeField] private GameObject loginPanel;
        [SerializeField] private GameObject registerPanel;

        [Header("Login")]
        [SerializeField] private TMP_InputField loginUsername;
        [SerializeField] private TMP_InputField loginPassword;
        [SerializeField] private Button         loginButton;
        [SerializeField] private TMP_Text       loginError;

        [Header("Register")]
        [SerializeField] private TMP_InputField registerUsername;
        [SerializeField] private TMP_InputField registerEmail;
        [SerializeField] private TMP_InputField registerPassword;
        [SerializeField] private Button         registerButton;
        [SerializeField] private TMP_Text       registerError;
        [SerializeField] private TMP_Text       registerSuccess;

        private void Awake()
        {
            // ── Tự tìm panels ─────────────────────────────────────────────────
            // Dùng != null thay vì ?? vì Unity Object "Missing" không bị ?? nhận ra
            if (loginPanel    == null) loginPanel    = FindGO("LoginPanel");
            if (registerPanel == null) registerPanel = FindGO("RegisterPanel");

            if (loginPanel == null)
            { Debug.LogError("[LoginUI] LoginPanel not found. Build Login UI first."); return; }

            // ── Tự tìm Login components ───────────────────────────────────────
            if (loginUsername == null) loginUsername = Deep<TMP_InputField>(loginPanel, "LoginUsername");
            if (loginPassword == null) loginPassword = Deep<TMP_InputField>(loginPanel, "LoginPassword");
            if (loginButton   == null) loginButton   = Deep<Button>(loginPanel,         "LoginButton");
            if (loginError    == null) loginError    = Deep<TMP_Text>(loginPanel,        "LoginError");

            // ── Tự tìm Register components ────────────────────────────────────
            if (registerPanel != null)
            {
                if (registerUsername == null) registerUsername = Deep<TMP_InputField>(registerPanel, "RegisterUsername");
                if (registerEmail    == null) registerEmail    = Deep<TMP_InputField>(registerPanel, "RegisterEmail");
                if (registerPassword == null) registerPassword = Deep<TMP_InputField>(registerPanel, "RegisterPassword");
                if (registerButton   == null) registerButton   = Deep<Button>(registerPanel,         "RegisterButton");
                if (registerError    == null) registerError    = Deep<TMP_Text>(registerPanel,        "RegisterError");
                if (registerSuccess  == null) registerSuccess  = Deep<TMP_Text>(registerPanel,        "RegisterSuccess");
            }

            // ── Wire onClick (RemoveAll trước để tránh duplicate) ─────────────
            Wire(loginButton,    OnLoginClicked);
            Wire(registerButton, OnRegisterClicked);

            // Toggle buttons
            Wire(Deep<Button>(loginPanel,    "ToRegisterButton"), ShowRegister);
            if (registerPanel != null)
                Wire(Deep<Button>(registerPanel, "ToLoginButton"), ShowLogin);
        }

        private void Start()
        {
            if (AuthManager.Instance != null && AuthManager.Instance.IsLoggedIn)
            {
                SceneManager.LoadScene("LobbyScene");
                return;
            }
            ShowLogin();
        }

        // ── Panel toggle ──────────────────────────────────────────────────────

        public void ShowLogin()
        {
            if (loginPanel    != null) loginPanel.SetActive(true);
            if (registerPanel != null) registerPanel.SetActive(false);
            ClearLoginError();
        }

        public void ShowRegister()
        {
            if (loginPanel    != null) loginPanel.SetActive(false);
            if (registerPanel != null) registerPanel.SetActive(true);
            ClearRegisterMessages();
        }

        // ── Login ─────────────────────────────────────────────────────────────

        public async void OnLoginClicked()
        {
            if (loginUsername == null || loginPassword == null) return;

            var username = loginUsername.text.Trim();
            var password = loginPassword.text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ShowLoginError("Vui long nhap day du thong tin");
                return;
            }

            SetLoginInteractable(false);
            ClearLoginError();

            var err = await AuthManager.Instance.LoginAsync(username, password);

            if (err != null)
            {
                ShowLoginError(err);
                SetLoginInteractable(true);
                return;
            }

            SceneManager.LoadScene("LobbyScene");
        }

        // ── Register ──────────────────────────────────────────────────────────

        public async void OnRegisterClicked()
        {
            if (registerUsername == null || registerEmail == null || registerPassword == null) return;

            var username = registerUsername.text.Trim();
            var email    = registerEmail.text.Trim();
            var password = registerPassword.text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                ShowRegisterError("Vui long nhap day du thong tin");
                return;
            }

            SetRegisterInteractable(false);
            ClearRegisterMessages();

            var err = await AuthManager.Instance.RegisterAsync(username, email, password);
            SetRegisterInteractable(true);

            if (err != null) { ShowRegisterError(err); return; }

            if (registerSuccess != null) registerSuccess.text = "Dang ky thanh cong! Hay dang nhap.";
            await Task.Delay(1500);
            ShowLogin();
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        void ShowLoginError(string msg)
        {
            if (loginError == null) return;
            loginError.text = msg;
            loginError.gameObject.SetActive(true);
        }

        void ClearLoginError()
        {
            if (loginError != null) loginError.gameObject.SetActive(false);
        }

        void ShowRegisterError(string msg)
        {
            if (registerError == null) return;
            registerError.text = msg;
            registerError.gameObject.SetActive(true);
        }

        void ClearRegisterMessages()
        {
            if (registerError   != null) registerError.gameObject.SetActive(false);
            if (registerSuccess != null) registerSuccess.gameObject.SetActive(false);
        }

        void SetLoginInteractable(bool v)    { if (loginButton    != null) loginButton.interactable    = v; }
        void SetRegisterInteractable(bool v) { if (registerButton != null) registerButton.interactable = v; }

        // ── Auto-find helpers ─────────────────────────────────────────────────

        static void Wire(Button btn, UnityEngine.Events.UnityAction action)
        {
            if (btn == null) return;
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }

        static GameObject FindGO(string name)
        {
            var canvas = Object.FindObjectOfType<Canvas>();
            if (canvas == null) return null;
            return DeepGO(canvas.transform, name);
        }

        static T Deep<T>(GameObject root, string name) where T : Component
        {
            if (root == null) return null;
            var go = DeepGO(root.transform, name);
            return go != null ? go.GetComponent<T>() : null;
        }

        static GameObject DeepGO(Transform t, string name)
        {
            if (t.name == name) return t.gameObject;
            foreach (Transform c in t) { var f = DeepGO(c, name); if (f != null) return f; }
            return null;
        }
    }
}
