#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// Tự TẠO toàn bộ UI hierarchy từ đầu cho mỗi scene.
/// Menu: FishGame ▶ Build [Scene] UI  (xóa cái cũ, tạo lại hoàn chỉnh)
/// Sau khi chạy: Ctrl+S để lưu scene.
/// </summary>
public static class UISceneSetup
{
    // ── Palette ───────────────────────────────────────────────────────────────
    static Color BG_DEEP  = H("#08111F");
    static Color BG_CARD  = H("#0F1E35");
    static Color BG_INPUT = H("#162640");
    static Color ACCENT   = H("#29B6F6");
    static Color SUCCESS  = H("#43A047");
    static Color DANGER   = H("#E53935");
    static Color WARN     = H("#FB8C00");
    static Color GOLD     = H("#FFD600");
    static Color TXT      = H("#E8EAF6");
    static Color TXTS     = H("#7986CB");
    static Color OVERLAY  = new Color(.02f,.05f,.12f,.92f);

    // ════════════════════════════════════════════════════════════════════════
    //  LOGIN SCENE
    // ════════════════════════════════════════════════════════════════════════
    // Xóa toàn bộ UI cũ dưới Canvas rồi tạo lại
    // ── Hướng dẫn đặt script ─────────────────────────────────────────────────
    // LoginScene:  LoginUI  → đặt trên Canvas hoặc Managers (KHÔNG phải child Canvas)
    // LobbyScene:  LobbyUI  → đặt trên Canvas hoặc Managers
    // GameScene:   SessionUI, BetUI → đặt trên Canvas hoặc Managers
    // Tất cả script tự tìm component qua Awake() — KHÔNG cần kéo thả Inspector
    // ─────────────────────────────────────────────────────────────────────────

    [MenuItem("FishGame/CLEAR and Rebuild Lobby UI", false, 5)]
    static void ClearRebuildLobby()
    {
        var canvas = Object.FindObjectOfType<Canvas>();
        if (canvas == null) { Debug.LogError("No Canvas"); return; }

        // Xóa tất cả child của Canvas (giữ lại EventSystem)
        var children = new System.Collections.Generic.List<GameObject>();
        foreach (Transform c in canvas.transform) children.Add(c.gameObject);
        foreach (var c in children) Object.DestroyImmediate(c);

        Debug.Log("[UISetup] Canvas cleared");
        BuildLobby();
    }

    [MenuItem("FishGame/CLEAR and Rebuild Login UI", false, 4)]
    static void ClearRebuildLogin()
    {
        var canvas = Object.FindObjectOfType<Canvas>();
        if (canvas == null) { Debug.LogError("No Canvas"); return; }
        var children = new System.Collections.Generic.List<GameObject>();
        foreach (Transform c in canvas.transform) children.Add(c.gameObject);
        foreach (var c in children) Object.DestroyImmediate(c);
        BuildLogin();
    }

    [MenuItem("FishGame/CLEAR and Rebuild Game UI", false, 6)]
    static void ClearRebuildGame()
    {
        var canvas = Object.FindObjectOfType<Canvas>();
        if (canvas == null) { Debug.LogError("No Canvas"); return; }
        var children = new System.Collections.Generic.List<GameObject>();
        foreach (Transform c in canvas.transform) children.Add(c.gameObject);
        foreach (var c in children) Object.DestroyImmediate(c);
        BuildGame();
    }

    [MenuItem("FishGame/Build Login Scene UI", false, 10)]
    static void BuildLogin()
    {
        var canvas = PrepCanvas(BG_DEEP);

        // ── LoginPanel ───────────────────────────────────────────────────────
        var lp = GetOrMake(canvas.transform, "LoginPanel");
        R(lp, A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,0), V(400, 490));
        I(lp, BG_CARD);

        MakeText(lp, "LoginTitle", "FISH GAME", 30, ACCENT, bold:true,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,170), V(360,46));

        MakeText(lp, "LoginSubtitle", "Dang nhap tai khoan", 13, TXTS, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,130), V(360,26));

        MakeLine(lp, V(0,95));

        MakeInputField(lp, "LoginUsername", "Ten dang nhap",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,45), V(340,50));

        var pwGo = MakeInputField(lp, "LoginPassword", "Mat khau",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-20), V(340,50));
        var pw = pwGo.GetComponent<TMP_InputField>();
        if (pw != null) pw.contentType = TMP_InputField.ContentType.Password;

        MakeButton(lp, "LoginButton", "DANG NHAP", ACCENT, Color.white, 17,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-95), V(280,52));

        MakeText(lp, "LoginError", "", 13, DANGER, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-160), V(340,28));

        MakeLinkButton(lp, "ToRegisterButton", "Chua co tai khoan? Dang ky ngay",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-200), V(340,32));

        // ── RegisterPanel ─────────────────────────────────────────────────────
        var rp = GetOrMake(canvas.transform, "RegisterPanel");
        R(rp, A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,0), V(400, 560));
        I(rp, BG_CARD);
        rp.SetActive(false);

        MakeText(rp, "RegisterTitle", "TAO TAI KHOAN", 28, ACCENT, bold:true,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,205), V(360,44));

        MakeLine(rp, V(0,175));

        MakeInputField(rp, "RegisterUsername", "Ten dang nhap",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,125), V(340,50));

        MakeInputField(rp, "RegisterEmail", "Email",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,60), V(340,50));

        var rpwGo = MakeInputField(rp, "RegisterPassword", "Mat khau",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-5), V(340,50));
        var rpw = rpwGo.GetComponent<TMP_InputField>();
        if (rpw != null) rpw.contentType = TMP_InputField.ContentType.Password;

        MakeButton(rp, "RegisterButton", "TAO TAI KHOAN", SUCCESS, Color.white, 17,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-75), V(280,52));

        MakeText(rp, "RegisterError", "", 13, DANGER, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-135), V(340,26));

        MakeText(rp, "RegisterSuccess", "", 13, SUCCESS, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-165), V(340,26));

        MakeLinkButton(rp, "ToLoginButton", "<- Da co tai khoan? Dang nhap",
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-210), V(340,32));

        WireLoginUI(canvas);
        Done("LoginScene");
    }

    // ════════════════════════════════════════════════════════════════════════
    //  LOBBY SCENE
    // ════════════════════════════════════════════════════════════════════════
    [MenuItem("FishGame/Build Lobby Scene UI", false, 11)]
    static void BuildLobby()
    {
        var canvas = PrepCanvas(BG_DEEP);

        // ── Header (top, full width 68px) ────────────────────────────────────
        var hdr = GetOrMake(canvas.transform, "Header");
        R(hdr, A(0,1), A(1,1), A(.5f,1), V(0,0), V(0,68));
        I(hdr, BG_CARD);

        // accent bottom border
        var hLine = GetOrMake(hdr.transform, "AccentLine");
        R(hLine, A(0,0), A(1,0), A(.5f,0), V(0,0), V(0,2));
        I(hLine, ACCENT);

        MakeText(hdr, "BalanceText", "VND 0", 20, GOLD, bold:true,
            A(0,0), A(0,1), A(0,.5f), V(20,0), V(240,0));

        MakeText(hdr, "UsernameText", "Xin chao", 14, TXTS, bold:false,
            A(.5f,0), A(.5f,1), A(.5f,.5f), V(0,0), V(280,0));

        MakeButton(hdr, "LogoutButton", "Dang xuat", DANGER, Color.white, 13,
            A(1,.5f), A(1,.5f), A(1,.5f), V(-14,0), V(108,40));

        // ── Page label ────────────────────────────────────────────────────────
        MakeText(canvas, "StatusText", "Danh sach phong", 18, TXT, bold:true,
            A(0,1), A(1,1), A(.5f,1), V(20,-84), V(-40,32));

        // ── ScrollView ────────────────────────────────────────────────────────
        var sv = GetOrMake(canvas.transform, "RoomScrollView");
        R(sv, A(0,0), A(1,1), A(.5f,.5f), V(0,-4), V(-40,-128));
        var svImg = sv.GetOrAdd<Image>(); svImg.color = Color.clear;
        var sr = sv.GetOrAdd<ScrollRect>(); sr.horizontal = false;

        var vp = GetOrMake(sv.transform, "Viewport");
        R(vp, A(0,0), A(1,1), A(0,1), V(0,0), V(0,0));
        vp.GetOrAdd<RectMask2D>();
        var vpImg = vp.GetOrAdd<Image>(); vpImg.color = Color.clear;
        sr.viewport = vp.GetComponent<RectTransform>();

        var ct = GetOrMake(vp.transform, "Content");
        R(ct, A(0,1), A(1,1), A(.5f,1), V(0,0), V(0,0));
        var vlg = ct.GetOrAdd<VerticalLayoutGroup>();
        vlg.spacing = 10; vlg.padding = new RectOffset(0,0,8,8);
        vlg.childControlHeight = false; vlg.childControlWidth = true;
        vlg.childForceExpandWidth = true; vlg.childForceExpandHeight = false;
        var csf = ct.GetOrAdd<ContentSizeFitter>();
        csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
        sr.content = ct.GetComponent<RectTransform>();

        WireLobbyUI(canvas);
        Done("LobbyScene");
    }

    // ════════════════════════════════════════════════════════════════════════
    //  GAME SCENE
    // ════════════════════════════════════════════════════════════════════════
    [MenuItem("FishGame/Build Game Scene UI", false, 12)]
    static void BuildGame()
    {
        var canvas = PrepCanvas(Color.clear); // game world visible under canvas

        // ── HUD (top bar) ─────────────────────────────────────────────────────
        var hud = GetOrMake(canvas.transform, "GameHUD");
        R(hud, A(0,1), A(1,1), A(.5f,1), V(0,0), V(0,60));
        I(hud, new Color(.04f,.08f,.16f,.80f));

        MakeText(hud, "BalanceText", "VND 0", 20, GOLD, bold:true,
            A(0,0), A(0,1), A(0,.5f), V(16,0), V(220,0));
        MakeText(hud, "FishKilledText", "Ca: 0", 18, ACCENT, bold:false,
            A(.5f,0), A(.5f,1), A(.5f,.5f), V(0,0), V(160,0));
        MakeText(hud, "EarnText", "+0", 18, SUCCESS, bold:true,
            A(1,0), A(1,1), A(1,.5f), V(-16,0), V(180,0));
        MakeText(hud, "SeatIdText", "Seat #0", 12, TXTS, bold:false,
            A(1,0), A(1,0), A(1,0), V(-16,6), V(120,18));

        // ── BetUI (bottom-left) ───────────────────────────────────────────────
        var bet = GetOrMake(canvas.transform, "BetUI");
        R(bet, A(0,0), A(0,0), A(0,0), V(16,16), V(210,56));
        I(bet, new Color(.04f,.08f,.16f,.85f));

        MakeButton(bet, "DecreaseButton", "-", WARN, Color.white, 26,
            A(0,0), A(0,1), A(0,.5f), V(4,0), V(48,48));

        MakeText(bet, "BetAmountText", "10", 20, GOLD, bold:true,
            A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(-108,0));

        MakeButton(bet, "IncreaseButton", "+", SUCCESS, Color.white, 26,
            A(1,0), A(1,1), A(1,.5f), V(-4,0), V(48,48));

        // ── SessionUI (bottom-right) ──────────────────────────────────────────
        var sess = GetOrMake(canvas.transform, "SessionUI");
        R(sess, A(1,0), A(1,0), A(1,0), V(-16,16), V(200,56));
        I(sess, new Color(.04f,.08f,.16f,.85f));
        MakeText(sess, "WaitingText", "Cho nguoi choi...", 13, TXTS, bold:false,
            A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(0,0));

        // ── SessionEndPanel (full-screen overlay) ─────────────────────────────
        var endP = GetOrMake(canvas.transform, "SessionEndPanel");
        R(endP, A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(0,0));
        I(endP, OVERLAY);
        endP.SetActive(false);

        // Center result card
        var card = GetOrMake(endP.transform, "ResultCard");
        R(card, A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,0), V(420,400));
        I(card, BG_CARD);

        MakeText(card, "EndTitle", "KET THUC PHIEN", 26, ACCENT, bold:true,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,150), V(380,44));
        MakeLine(card, V(0,120));
        MakeText(card, "EarnLabel", "Thu duoc:  +0", 22, SUCCESS, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,72), V(360,38));
        MakeText(card, "SpendLabel", "Chi tieu:  0", 22, WARN, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,20), V(360,38));
        MakeText(card, "FinalBalanceLabel", "So du:  0", 18, TXT, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-32), V(360,36));
        MakeLine(card, V(0,-68));
        MakeButton(card, "BackToLobbyButton", "Ve Lobby", ACCENT, Color.white, 17,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-130), V(200,52));

        // ── ErrorPanel ────────────────────────────────────────────────────────
        var errP = GetOrMake(canvas.transform, "ErrorPanel");
        R(errP, A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(0,0));
        I(errP, OVERLAY);
        errP.SetActive(false);

        MakeText(errP, "ErrorTitle", "MAT KET NOI", 30, DANGER, bold:true,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,70), V(440,50));
        MakeText(errP, "ErrorMessage", "", 16, TXT, bold:false,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,5), V(440,60));
        MakeButton(errP, "ErrorBackButton", "Ve Lobby", WARN, Color.white, 17,
            A(.5f,.5f), A(.5f,.5f), A(.5f,.5f), V(0,-70), V(200,52));

        WireSessionUI(canvas);
        WireBetUI(canvas);
        Done("GameScene");
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ROOM ITEM PREFAB  (Select prefab → run this)
    // ════════════════════════════════════════════════════════════════════════
    [MenuItem("FishGame/Build RoomItem Prefab", false, 20)]
    static void BuildRoomItem()
    {
        var go = Selection.activeGameObject;
        if (go == null || go.GetComponent<FishGame.UI.RoomItem>() == null)
        { Debug.LogWarning("[UISetup] Select the RoomItem prefab first"); return; }

        R(go, A(0,1), A(1,1), A(.5f,1), V(0,0), V(0, 80));
        I(go, BG_CARD);

        // Left accent stripe
        var stripe = GetOrMake(go.transform, "Stripe");
        R(stripe, A(0,0), A(0,1), A(0,.5f), V(0,0), V(4,0));
        I(stripe, ACCENT);

        MakeText(go, "RoomNameText", "Phong 1", 19, TXT, bold:true,
            A(0,0), A(0,1), A(0,.5f), V(24,0), V(260,0));

        MakeText(go, "RtpText", "RTP 95%", 14, ACCENT, bold:false,
            A(.5f,0), A(.5f,1), A(.5f,.5f), V(-30,0), V(110,0));

        MakeButton(go, "JoinButton", "Vao phong", SUCCESS, Color.white, 14,
            A(1,.5f), A(1,.5f), A(1,.5f), V(-14,0), V(120,44));

        EditorUtility.SetDirty(go);
        Debug.Log("[UISetup] RoomItem OK — Ctrl+S de luu prefab");
    }

    // ════════════════════════════════════════════════════════════════════════
    //  FACTORY HELPERS
    // ════════════════════════════════════════════════════════════════════════

    static Canvas PrepCanvas(Color bg)
    {
        // ── EventSystem (bắt buộc để button hoạt động) ───────────────────────
        if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            var esGo = new GameObject("EventSystem");
            esGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
            esGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            Debug.Log("[UISetup] Created EventSystem");
        }

        // ── Canvas ────────────────────────────────────────────────────────────
        var canvas = Object.FindObjectOfType<Canvas>();
        if (canvas == null)
        {
            var cgo = new GameObject("Canvas");
            canvas = cgo.AddComponent<Canvas>();
            cgo.AddComponent<CanvasScaler>();
            cgo.AddComponent<GraphicRaycaster>();
        }
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        var scaler = canvas.GetOrAdd<CanvasScaler>();
        scaler.uiScaleMode         = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920, 1080);
        scaler.matchWidthOrHeight  = 0.5f;

        canvas.GetOrAdd<GraphicRaycaster>();

        // Canvas background: raycastTarget PHẢI false, không thì chặn mọi click
        var canvasImg = canvas.GetOrAdd<Image>();
        canvasImg.color         = bg.a > 0 ? bg : Color.clear;
        canvasImg.raycastTarget = false;   // <── quan trọng

        return canvas;
    }

    // GetOrMake: find child by name, or create new
    static GameObject GetOrMake(Transform parent, string name)
    {
        var t = parent.Find(name);
        if (t != null) return t.gameObject;
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.AddComponent<RectTransform>();
        return go;
    }

    // Canvas overload
    static GameObject GetOrMake(Canvas canvas, string name)
        => GetOrMake(canvas.transform, name);

    static void MakeLine(GameObject parent, Vector2 pos)
    {
        var name = $"Line_{(int)pos.y}";
        var go = GetOrMake(parent.transform, name);
        R(go, A(0,.5f), A(1,.5f), A(.5f,.5f), pos, V(-40, 1));
        I(go, new Color(1,1,1,.10f));
    }

    static void MakeText(GameObject parent, string childName, string text,
        float fs, Color col, bool bold,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
    {
        var go = GetOrMake(parent.transform, childName);
        R(go, amin, amax, pivot, pos, size);
        var t = go.GetOrAdd<TextMeshProUGUI>();
        t.text = text; t.fontSize = fs; t.color = col;
        t.alignment = TextAlignmentOptions.Center;
        t.fontStyle = bold ? FontStyles.Bold : FontStyles.Normal;
        t.enableWordWrapping = false;
        t.overflowMode = TextOverflowModes.Ellipsis;
        t.raycastTarget = false;
    }

    // Canvas overload
    static void MakeText(Canvas canvas, string childName, string text,
        float fs, Color col, bool bold,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
        => MakeText(canvas.gameObject, childName, text, fs, col, bold, amin, amax, pivot, pos, size);

    static GameObject MakeInputField(GameObject parent, string childName, string placeholder,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
    {
        var root = GetOrMake(parent.transform, childName);
        R(root, amin, amax, pivot, pos, size);

        // InputField root Image: raycastTarget = TRUE (cần để click vào field)
        var bg = root.GetOrAdd<Image>();
        bg.color         = BG_INPUT;
        bg.raycastTarget = true;

        // Left accent border — decorative, không block click
        var borderGo = GetOrMake(root.transform, "__border");
        R(borderGo, A(0,0), A(0,1), A(0,.5f), V(0,0), V(3,0));
        I(borderGo, new Color(ACCENT.r, ACCENT.g, ACCENT.b, .6f));

        // TMP InputField text area
        var taGo = GetOrMake(root.transform, "Text Area");
        R(taGo, A(0,0), A(1,1), A(0,0), V(10,0), V(-14,0));
        taGo.GetOrAdd<RectMask2D>();

        var phGo = GetOrMake(taGo.transform, "Placeholder");
        R(phGo, A(0,0), A(1,1), A(0,0), V(0,0), V(0,0));
        var phTxt = phGo.GetOrAdd<TextMeshProUGUI>();
        phTxt.text              = placeholder;
        phTxt.fontSize          = 15;
        phTxt.color             = TXTS;
        phTxt.fontStyle         = FontStyles.Italic;
        phTxt.alignment         = TextAlignmentOptions.Left;
        phTxt.enableWordWrapping = false;
        phTxt.raycastTarget     = false;   // text không block click

        var txtGo = GetOrMake(taGo.transform, "Text");
        R(txtGo, A(0,0), A(1,1), A(0,0), V(0,0), V(0,0));
        var txtTmp = txtGo.GetOrAdd<TextMeshProUGUI>();
        txtTmp.fontSize          = 16;
        txtTmp.color             = TXT;
        txtTmp.alignment         = TextAlignmentOptions.Left;
        txtTmp.enableWordWrapping = false;
        txtTmp.raycastTarget     = false;  // text không block click

        var field = root.GetOrAdd<TMP_InputField>();
        field.textComponent = txtTmp;
        field.placeholder   = phTxt;
        field.pointSize     = 16;

        return root;
    }

    static void MakeButton(GameObject parent, string childName, string label,
        Color bg, Color fg, float fs,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
    {
        var go = GetOrMake(parent.transform, childName);
        R(go, amin, amax, pivot, pos, size);
        var img = go.GetOrAdd<Image>();
        img.color         = bg;
        img.raycastTarget = true;  // button PHẢI nhận raycast

        var btn = go.GetOrAdd<Button>();
        var cs = btn.colors;
        cs.normalColor      = bg;
        cs.highlightedColor = Lighten(bg, .15f);
        cs.pressedColor     = Darken(bg, .15f);
        cs.disabledColor    = new Color(bg.r, bg.g, bg.b, .4f);
        cs.colorMultiplier  = 1f;
        btn.colors = cs;

        var txtGo = GetOrMake(go.transform, "Text");
        R(txtGo, A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(0,0));
        var t = txtGo.GetOrAdd<TextMeshProUGUI>();
        t.text = label; t.fontSize = fs; t.color = fg;
        t.alignment = TextAlignmentOptions.Center;
        t.fontStyle = FontStyles.Bold;
        t.enableWordWrapping = false;
        t.raycastTarget = false;
    }

    // Canvas overload
    static void MakeButton(Canvas canvas, string childName, string label,
        Color bg, Color fg, float fs,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
        => MakeButton(canvas.gameObject, childName, label, bg, fg, fs, amin, amax, pivot, pos, size);

    static void MakeLinkButton(GameObject parent, string childName, string label,
        Vector2 amin, Vector2 amax, Vector2 pivot, Vector2 pos, Vector2 size)
    {
        var go = GetOrMake(parent.transform, childName);
        R(go, amin, amax, pivot, pos, size);
        var img = go.GetOrAdd<Image>();
        img.color         = Color.clear;
        img.raycastTarget = true;  // trong suốt nhưng vẫn nhận click
        go.GetOrAdd<Button>();

        var txtGo = GetOrMake(go.transform, "Text");
        R(txtGo, A(0,0), A(1,1), A(.5f,.5f), V(0,0), V(0,0));
        var t = txtGo.GetOrAdd<TextMeshProUGUI>();
        t.text = label; t.fontSize = 13; t.color = ACCENT;
        t.alignment = TextAlignmentOptions.Center;
        t.fontStyle = FontStyles.Underline;
        t.enableWordWrapping = false;
        t.raycastTarget = false;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  WIRE FIELDS  (SerializedObject — giữ nguyên sau mỗi lần CLEAR+Rebuild)
    // ════════════════════════════════════════════════════════════════════════

    // Xóa một loại script khỏi Canvas (tránh script sai scene)
    static void Strip<T>(GameObject go) where T : MonoBehaviour
    {
        foreach (var c in go.GetComponents<T>()) Object.DestroyImmediate(c);
    }

    static void WireLoginUI(Canvas canvas)
    {
        Strip<FishGame.UI.LobbyUI>(canvas.gameObject);
        Strip<FishGame.UI.SessionUI>(canvas.gameObject);
        Strip<FishGame.UI.BetUI>(canvas.gameObject);
        var ui = EnsureOne<FishGame.UI.LoginUI>(canvas.gameObject);
        var so = new SerializedObject(ui);

        var lp = Deep(canvas.transform, "LoginPanel");
        var rp = Deep(canvas.transform, "RegisterPanel");

        SetF(so, "loginPanel",    lp?.gameObject);
        SetF(so, "registerPanel", rp?.gameObject);

        if (lp != null)
        {
            SetF(so, "loginUsername", Deep(lp, "LoginUsername")?.GetComponent<TMP_InputField>());
            SetF(so, "loginPassword", Deep(lp, "LoginPassword")?.GetComponent<TMP_InputField>());
            SetF(so, "loginButton",   Deep(lp, "LoginButton")  ?.GetComponent<Button>());
            SetF(so, "loginError",    Deep(lp, "LoginError")   ?.GetComponent<TMP_Text>());
        }
        if (rp != null)
        {
            SetF(so, "registerUsername", Deep(rp, "RegisterUsername")?.GetComponent<TMP_InputField>());
            SetF(so, "registerEmail",    Deep(rp, "RegisterEmail")   ?.GetComponent<TMP_InputField>());
            SetF(so, "registerPassword", Deep(rp, "RegisterPassword")?.GetComponent<TMP_InputField>());
            SetF(so, "registerButton",   Deep(rp, "RegisterButton")  ?.GetComponent<Button>());
            SetF(so, "registerError",    Deep(rp, "RegisterError")   ?.GetComponent<TMP_Text>());
            SetF(so, "registerSuccess",  Deep(rp, "RegisterSuccess") ?.GetComponent<TMP_Text>());
        }

        so.ApplyModifiedProperties();
        EditorUtility.SetDirty(ui);
    }

    static void WireLobbyUI(Canvas canvas)
    {
        Strip<FishGame.UI.LoginUI>(canvas.gameObject);
        Strip<FishGame.UI.SessionUI>(canvas.gameObject);
        Strip<FishGame.UI.BetUI>(canvas.gameObject);
        var ui = EnsureOne<FishGame.UI.LobbyUI>(canvas.gameObject);
        var so = new SerializedObject(ui);

        var hdr = Deep(canvas.transform, "Header");
        var ct  = Deep(canvas.transform, "Content");

        SetF(so, "balanceText",    hdr != null ? Deep(hdr, "BalanceText") ?.GetComponent<TMP_Text>() : null);
        SetF(so, "usernameText",   hdr != null ? Deep(hdr, "UsernameText")?.GetComponent<TMP_Text>() : null);
        SetF(so, "logoutButton",   hdr != null ? Deep(hdr, "LogoutButton")?.GetComponent<Button>()   : null);
        SetF(so, "statusText",     Deep(canvas.transform, "StatusText")?.GetComponent<TMP_Text>());
        SetF(so, "roomListParent", ct);   // Transform field

        so.ApplyModifiedProperties();
        EditorUtility.SetDirty(ui);
    }

    static void WireSessionUI(Canvas canvas)
    {
        Strip<FishGame.UI.LoginUI>(canvas.gameObject);
        Strip<FishGame.UI.LobbyUI>(canvas.gameObject);
        var ui = EnsureOne<FishGame.UI.SessionUI>(canvas.gameObject);
        var so = new SerializedObject(ui);

        var hud  = Deep(canvas.transform, "GameHUD");
        var betGo = Deep(canvas.transform, "BetUI");
        var endP  = Deep(canvas.transform, "SessionEndPanel");
        var errP  = Deep(canvas.transform, "ErrorPanel");
        var card  = endP != null ? Deep(endP, "ResultCard") : null;

        SetF(so, "balanceText",           hud != null ? Deep(hud, "BalanceText")   ?.GetComponent<TMP_Text>() : null);
        SetF(so, "fishKilledText",        hud != null ? Deep(hud, "FishKilledText")?.GetComponent<TMP_Text>() : null);
        SetF(so, "earnText",              hud != null ? Deep(hud, "EarnText")      ?.GetComponent<TMP_Text>() : null);
        SetF(so, "seatIdText",            hud != null ? Deep(hud, "SeatIdText")    ?.GetComponent<TMP_Text>() : null);
        SetF(so, "betAmountText",         betGo != null ? Deep(betGo, "BetAmountText")?.GetComponent<TMP_Text>() : null);
        SetF(so, "sessionEndPanel",       endP?.gameObject);
        SetF(so, "sessionEndSummaryText", card != null ? Deep(card, "EarnLabel")?.GetComponent<TMP_Text>() : null);
        SetF(so, "errorPanel",            errP?.gameObject);
        SetF(so, "errorText",             errP != null ? Deep(errP, "ErrorMessage")?.GetComponent<TMP_Text>() : null);

        so.ApplyModifiedProperties();
        EditorUtility.SetDirty(ui);
    }

    static void WireBetUI(Canvas canvas)
    {
        var ui = EnsureOne<FishGame.UI.BetUI>(canvas.gameObject);
        var so = new SerializedObject(ui);

        var betGo = Deep(canvas.transform, "BetUI");
        SetF(so, "betLabel", betGo != null ? Deep(betGo, "BetAmountText")?.GetComponent<TMP_Text>() : null);
        // cannon và sessionUI cần gán thủ công (không phải UI object)

        so.ApplyModifiedProperties();
        EditorUtility.SetDirty(ui);
    }

    // ── Wire helpers ──────────────────────────────────────────────────────────

    // Tìm Transform theo tên (deep, đệ quy)
    static Transform Deep(Transform root, string name)
    {
        if (root == null) return null;
        if (root.name == name) return root;
        foreach (Transform c in root)
        {
            var f = Deep(c, name);
            if (f != null) return f;
        }
        return null;
    }

    // Gán field qua SerializedObject (không cần reflection)
    static void SetF(SerializedObject so, string field, Object val)
    {
        var p = so.FindProperty(field);
        if (p != null) p.objectReferenceValue = val;
        else Debug.LogWarning($"[UISetup] Field '{field}' not found");
    }

    // Đảm bảo chỉ có đúng 1 component — xóa bản thừa nếu có
    static T EnsureOne<T>(GameObject go) where T : MonoBehaviour
    {
        var all = go.GetComponents<T>();
        for (int i = 1; i < all.Length; i++) Object.DestroyImmediate(all[i]);
        return all.Length > 0 ? all[0] : go.AddComponent<T>();
    }

    // ── Layout helpers ────────────────────────────────────────────────────────
    static void R(GameObject go, Vector2 min, Vector2 max,
                  Vector2 pivot, Vector2 pos, Vector2 size)
    {
        var rt = go.GetOrAdd<RectTransform>();
        rt.anchorMin = min; rt.anchorMax = max;
        rt.pivot = pivot;
        rt.anchoredPosition = pos; rt.sizeDelta = size;
    }

    // Background image — KHÔNG được block raycast
    static void I(GameObject go, Color c)
    {
        var img = go.GetOrAdd<Image>();
        img.color         = c;
        img.raycastTarget = false;   // backgrounds không cần nhận click
    }

    static Vector2 V(float x, float y) => new Vector2(x, y);
    static Vector2 A(float x, float y) => new Vector2(x, y);

    static void Done(string scene)
    {
        foreach (var go in Object.FindObjectsOfType<GameObject>())
            EditorUtility.SetDirty(go);
        UnityEditor.SceneManagement.EditorSceneManager.MarkSceneDirty(
            UnityEngine.SceneManagement.SceneManager.GetActiveScene());
        Debug.Log($"[UISetup] {scene} OK — Ctrl+S de luu");
    }

    static Color H(string hex) { ColorUtility.TryParseHtmlString(hex, out var c); return c; }
    static Color Lighten(Color c, float a) =>
        new Color(Mathf.Clamp01(c.r+a), Mathf.Clamp01(c.g+a), Mathf.Clamp01(c.b+a), c.a);
    static Color Darken(Color c, float a) =>
        new Color(Mathf.Clamp01(c.r-a), Mathf.Clamp01(c.g-a), Mathf.Clamp01(c.b-a), c.a);
}

internal static class GoExt
{
    internal static T GetOrAdd<T>(this GameObject go) where T : Component
    { var c = go.GetComponent<T>(); return c ?? go.AddComponent<T>(); }
    internal static T GetOrAdd<T>(this Canvas cv) where T : Component
        => cv.gameObject.GetOrAdd<T>();
}
#endif
