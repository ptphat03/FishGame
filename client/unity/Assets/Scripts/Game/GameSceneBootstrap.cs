using FishGame.Net;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace FishGame.Game
{
    /// <summary>
    /// Đặt trên GameObject đầu tiên trong GameScene.
    /// Kiểm tra token và kết nối WS hợp lệ trước khi cho phép chơi.
    /// Nếu load thẳng GameScene mà không qua Lobby → redirect về Lobby.
    /// </summary>
    public class GameSceneBootstrap : MonoBehaviour
    {
        private void Start()
        {
            // Chưa đăng nhập → về Login
            if (AuthManager.Instance == null || !AuthManager.Instance.IsLoggedIn)
            {
                Debug.LogWarning("[GameSceneBootstrap] Không có token, chuyển về LoginScene");
                SceneManager.LoadScene("LoginScene");
                return;
            }

            // GameManager không có session đang chạy → về Lobby
            if (GameManager.Instance == null || !GameManager.Instance.InSession)
            {
                Debug.LogWarning("[GameSceneBootstrap] Không có session, chuyển về LobbyScene");
                SceneManager.LoadScene("LobbyScene");
                return;
            }

            Debug.Log("[GameSceneBootstrap] GameScene ready");
        }
    }
}
