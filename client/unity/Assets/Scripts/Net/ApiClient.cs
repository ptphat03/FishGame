using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace FishGame.Net
{
    /// <summary>
    /// Thin HTTP wrapper around UnityWebRequest.
    /// All methods return (T result, string errorMessage).
    /// errorMessage is null on success.
    /// </summary>
    public class ApiClient : MonoBehaviour
    {
        public static ApiClient Instance { get; private set; }

        [SerializeField] private string baseUrl = "http://localhost:5100";

        public string BaseUrl => baseUrl;

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ── Public API ────────────────────────────────────────────────────────

        public Task<(T result, string error)> GetAsync<T>(string path, string token = null)
            => SendAsync<T>(UnityWebRequest.Get(baseUrl + path), token);

        public Task<(T result, string error)> PostAsync<T>(string path, object body, string token = null)
        {
            var json    = JsonUtility.ToJson(body);
            var request = new UnityWebRequest(baseUrl + path, "POST");
            request.uploadHandler   = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            return SendAsync<T>(request, token);
        }

        // ── Core ──────────────────────────────────────────────────────────────

        private static async Task<(T, string)> SendAsync<T>(UnityWebRequest request, string token)
        {
            if (!string.IsNullOrEmpty(token))
                request.SetRequestHeader("Authorization", "Bearer " + token);

            var tcs = new TaskCompletionSource<bool>();
            request.SendWebRequest().completed += _ => tcs.TrySetResult(true);
            await tcs.Task;

            if (request.result != UnityWebRequest.Result.Success)
            {
                var errMsg = TryParseError(request.downloadHandler?.text) ?? request.error;
                Debug.LogWarning($"[ApiClient] {request.method} {request.url} → {request.responseCode} {errMsg}");
                request.Dispose();
                return (default, errMsg);
            }

            var json = request.downloadHandler.text;
            request.Dispose();

            try
            {
                return (JsonUtility.FromJson<T>(json), null);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ApiClient] JSON parse error: {ex.Message}\n{json}");
                return (default, "JSON parse error");
            }
        }

        private static string TryParseError(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                var err = JsonUtility.FromJson<ApiErrorResponse>(json);
                return err?.error?.message;
            }
            catch { return null; }
        }
    }
}
