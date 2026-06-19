using System.Threading.Tasks;
using UnityEngine;

namespace FishGame.Net
{
    /// <summary>
    /// Manages auth state: token storage, login, register.
    /// Token is persisted in PlayerPrefs so it survives scene loads.
    /// </summary>
    public class AuthManager : MonoBehaviour
    {
        public static AuthManager Instance { get; private set; }

        private const string TokenKey = "access_token";

        public string AccessToken    => PlayerPrefs.GetString(TokenKey, null);
        public bool   IsLoggedIn     => !string.IsNullOrEmpty(AccessToken);

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ── Auth API ──────────────────────────────────────────────────────────

        /// <summary>Returns null on success, error message on failure.</summary>
        public async Task<string> LoginAsync(string username, string password)
        {
            var (res, err) = await ApiClient.Instance.PostAsync<LoginApiResponse>(
                "/api/auth/login",
                new LoginPayload { username = username, password = password }
            );

            if (err != null) return err;
            if (res?.data == null) return "Phản hồi không hợp lệ";

            SaveToken(res.data.accessToken);
            return null;
        }

        /// <summary>Returns null on success, error message on failure.</summary>
        public async Task<string> RegisterAsync(string username, string email, string password)
        {
            var (_, err) = await ApiClient.Instance.PostAsync<RegisterApiResponse>(
                "/api/auth/register",
                new RegisterPayload { username = username, email = email, password = password }
            );

            return err;
        }

        public void Logout()
        {
            PlayerPrefs.DeleteKey(TokenKey);
            PlayerPrefs.Save();
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static void SaveToken(string token)
        {
            PlayerPrefs.SetString(TokenKey, token);
            PlayerPrefs.Save();
        }
    }
}
