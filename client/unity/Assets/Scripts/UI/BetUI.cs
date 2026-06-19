using FishGame.Game;
using TMPro;
using UnityEngine;

namespace FishGame.UI
{
    /// <summary>
    /// UI điều chỉnh bet amount (mức cược mỗi viên đạn).
    /// Wire CannonController.BetAmount từ đây.
    /// </summary>
    public class BetUI : MonoBehaviour
    {
        [SerializeField] private TMP_Text      betLabel;
        [SerializeField] private CannonController cannon;
        [SerializeField] private SessionUI     sessionUI;

        private static readonly long[] BetSteps = { 10, 50, 100, 500, 1000 };
        private int _stepIndex;

        private void Awake()
        {
            // Tự tìm BetUI children nếu chưa gán Inspector
            if (betLabel == null)
            {
                var betGo = GameObject.Find("BetUI");
                if (betGo != null)
                    betLabel = DeepGet<TMP_Text>(betGo.transform, "BetAmountText");
            }

            // Wire Decrease / Increase buttons
            var betGo2 = betLabel != null ? betLabel.transform.parent?.gameObject
                                          : GameObject.Find("BetUI");
            if (betGo2 != null)
            {
                Wire(DeepGet<UnityEngine.UI.Button>(betGo2.transform, "DecreaseButton"), OnDecrease);
                Wire(DeepGet<UnityEngine.UI.Button>(betGo2.transform, "IncreaseButton"), OnIncrease);
            }
        }

        private void Start()
        {
            _stepIndex = 0;
            Apply();
        }

        static void Wire(UnityEngine.UI.Button btn, UnityEngine.Events.UnityAction action)
        {
            if (btn == null) return;
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }

        static T DeepGet<T>(Transform root, string name) where T : Component
        {
            if (root == null) return null;
            if (root.name == name) return root.GetComponent<T>();
            foreach (Transform c in root) { var r = DeepGet<T>(c, name); if (r != null) return r; }
            return null;
        }

        public void OnIncrease()
        {
            if (_stepIndex < BetSteps.Length - 1)
            {
                _stepIndex++;
                Apply();
            }
        }

        public void OnDecrease()
        {
            if (_stepIndex > 0)
            {
                _stepIndex--;
                Apply();
            }
        }

        private void Apply()
        {
            var bet = BetSteps[_stepIndex];
            if (cannon    != null) cannon.BetAmount       = bet;
            if (betLabel  != null) betLabel.text           = $"{bet:N0}";
            if (sessionUI != null) sessionUI.RefreshBetAmount(bet);
        }
    }
}
