using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace FishGame.UI
{
    /// <summary>
    /// Add to the Canvas in every scene. Applies consistent colours/font at Start().
    /// Set SceneType in Inspector to pick the right theme variant.
    /// </summary>
    public class UITheme : MonoBehaviour
    {
        // ── Palette (static so other scripts can reference them) ──────────────
        public static Color Accent   => Hex("#29B6F6");
        public static Color Success  => Hex("#43A047");
        public static Color Danger   => Hex("#E53935");
        public static Color Warning  => Hex("#FB8C00");
        public static Color Gold     => Hex("#FFD600");
        public static Color TextMain => Hex("#E8EAF6");
        public static Color TextSub  => Hex("#7986CB");
        public static Color BgCard   => Hex("#0F1E35");
        public static Color BgInput  => Hex("#162640");
        public static Color BgDeep   => Hex("#08111F");

        [SerializeField] private SceneKind scene = SceneKind.Login;
        private enum SceneKind { Login, Lobby, Game }

        private void Awake()
        {
            switch (scene)
            {
                case SceneKind.Login: LoginTheme(); break;
                case SceneKind.Lobby: LobbyTheme(); break;
                case SceneKind.Game:  GameTheme();  break;
            }
        }

        void LoginTheme()
        {
            BgOf(gameObject, BgDeep);

            PanelOf("LoginPanel",    BgCard);
            PanelOf("RegisterPanel", BgCard);

            TxtOf("LoginTitle",    Accent,   32, bold: true);
            TxtOf("RegisterTitle", Accent,   28, bold: true);
            TxtOf("LoginSubtitle", TextSub,  14);
            TxtOf("LoginError",    Danger,   13);
            TxtOf("RegisterError", Danger,   13);
            TxtOf("RegisterSuccess", Success, 13);

            BtnOf("LoginButton",    Accent,  Color.white, 17);
            BtnOf("RegisterButton", Success, Color.white, 17);
            LinkOf("ToRegisterButton", Accent);
            LinkOf("ToLoginButton",    Accent);
        }

        void LobbyTheme()
        {
            BgOf(gameObject, BgDeep);

            PanelOf("Header", BgCard);
            TxtOf("BalanceText",  Gold,    20, bold: true);
            TxtOf("UsernameText", TextSub, 15);
            TxtOf("StatusText",   TextMain,18, bold: true);
            BtnOf("LogoutButton", Danger, Color.white, 13);
        }

        void GameTheme()
        {
            PanelOf("GameHUD", new Color(.04f,.08f,.16f,.80f));
            TxtOf("BalanceText",    Gold,    20, bold: true);
            TxtOf("FishKilledText", Accent,  18);
            TxtOf("EarnText",       Success, 18, bold: true);
            TxtOf("SeatIdText",     TextSub, 12);

            PanelOf("BetUI", new Color(.04f,.08f,.16f,.85f));
            TxtOf("BetAmountText", Gold, 20, bold: true);
            BtnOf("DecreaseButton", Warning, Color.white, 26);
            BtnOf("IncreaseButton", Success, Color.white, 26);

            PanelOf("SessionUI",      new Color(.04f,.08f,.16f,.85f));
            TxtOf("WaitingText",      TextSub, 14);

            PanelOf("SessionEndPanel", new Color(.02f,.05f,.12f,.92f));
            TxtOf("EndTitle",          Accent,  28, bold: true);
            TxtOf("EarnLabel",         Success, 22);
            TxtOf("SpendLabel",        Warning, 22);
            TxtOf("FinalBalanceLabel", TextMain,20);
            BtnOf("BackToLobbyButton", Accent, Color.white, 18);

            PanelOf("ErrorPanel",   new Color(.02f,.05f,.12f,.92f));
            TxtOf("ErrorTitle",     Danger,   30, bold: true);
            TxtOf("ErrorMessage",   TextMain, 16);
            BtnOf("ErrorBackButton", Warning, Color.white, 18);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        void BgOf(GameObject go, Color c)
        {
            var img = go.GetComponent<Image>();
            if (img != null) img.color = c;
        }

        void PanelOf(string name, Color c)
        {
            var go = Deep(transform, name);
            if (go == null) return;
            var img = go.GetComponent<Image>(); if (img != null) img.color = c;
        }

        void TxtOf(string name, Color c, float size, bool bold = false)
        {
            var go = Deep(transform, name); if (go == null) return;
            var t = go.GetComponent<TextMeshProUGUI>(); if (t == null) return;
            t.color = c; t.fontSize = size;
            t.fontStyle = bold ? FontStyles.Bold : FontStyles.Normal;
        }

        void BtnOf(string name, Color bg, Color fg, float fs = 16)
        {
            var go = Deep(transform, name); if (go == null) return;
            var img = go.GetComponent<Image>(); if (img != null) img.color = bg;
            var btn = go.GetComponent<Button>();
            if (btn != null)
            {
                var cs = btn.colors;
                cs.normalColor      = bg;
                cs.highlightedColor = new Color(bg.r+.1f, bg.g+.1f, bg.b+.1f, bg.a);
                cs.pressedColor     = new Color(bg.r-.1f, bg.g-.1f, bg.b-.1f, bg.a);
                btn.colors = cs;
            }
            var tc = Deep(go.transform, "Text"); if (tc == null) return;
            var t = tc.GetComponent<TextMeshProUGUI>(); if (t == null) return;
            t.color = fg; t.fontSize = fs; t.fontStyle = FontStyles.Bold;
        }

        void LinkOf(string name, Color c)
        {
            var go = Deep(transform, name); if (go == null) return;
            var img = go.GetComponent<Image>(); if (img != null) img.color = Color.clear;
            var tc = Deep(go.transform, "Text"); if (tc == null) return;
            var t = tc.GetComponent<TextMeshProUGUI>(); if (t == null) return;
            t.color = c; t.fontSize = 14; t.fontStyle = FontStyles.Underline;
        }

        static GameObject Deep(Transform root, string name)
        {
            if (root.name == name) return root.gameObject;
            foreach (Transform c in root) { var f = Deep(c, name); if (f != null) return f; }
            return null;
        }

        static Color Hex(string h) { ColorUtility.TryParseHtmlString(h, out var c); return c; }
    }
}
