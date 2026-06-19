using System;
using FishGame.Net;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace FishGame.UI
{
    /// <summary>
    /// Prefab controller cho 1 ô phòng trong danh sách lobby.
    /// Gán bởi LobbyUI.BuildRoomList().
    /// </summary>
    public class RoomItem : MonoBehaviour
    {
        [SerializeField] private TMP_Text roomNameText;
        [SerializeField] private TMP_Text rtpText;
        [SerializeField] private Button   joinButton;

        private void Awake()
        {
            // Auto-find child components if not wired in Inspector
            if (roomNameText == null)
                roomNameText = transform.Find("RoomNameText")?.GetComponent<TMP_Text>();
            if (rtpText == null)
                rtpText = transform.Find("RtpText")?.GetComponent<TMP_Text>();
            if (joinButton == null)
                joinButton = transform.Find("JoinButton")?.GetComponent<Button>();
        }

        public void Setup(RoomData room, Action onJoin)
        {
            if (roomNameText != null) roomNameText.text = room.name;
            if (rtpText      != null) rtpText.text      = $"RTP {room.rtp * 100:F0}%";
            if (joinButton   != null) joinButton.onClick.AddListener(() => onJoin());
        }
    }
}
