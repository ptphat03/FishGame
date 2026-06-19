using System;
using UnityEngine;

namespace FishGame.Net
{
    // ── Auth ─────────────────────────────────────────────────────────────────

    [Serializable] public class LoginPayload
    {
        public string username;
        public string password;
    }

    [Serializable] public class RegisterPayload
    {
        public string username;
        public string email;
        public string password;
    }

    [Serializable] public class LoginData
    {
        public string accessToken;
        public long   accessTokenExpiresAt;
    }

    [Serializable] public class LoginApiResponse   { public LoginData    data; }

    [Serializable] public class RegisterData
    {
        public long   id;
        public string username;
        public int    roleId;
    }

    [Serializable] public class RegisterApiResponse { public RegisterData data; }

    [Serializable] public class MeData
    {
        public long   id;
        public string username;
        public string email;
        public int    roleId;
    }

    [Serializable] public class MeApiResponse { public MeData data; }

    // ── Room ─────────────────────────────────────────────────────────────────

    [Serializable] public class RoomData
    {
        public long   id;
        public string name;
        public int    maxPlayers;
        public double rtp;
        public string description;
    }

    [Serializable] public class RoomsApiResponse { public RoomData[] data; }

    // ── Wallet ───────────────────────────────────────────────────────────────

    [Serializable] public class WalletData
    {
        public long   userId;
        public long   balance;
    }

    [Serializable] public class WalletApiResponse { public WalletData data; }

    // ── Error ────────────────────────────────────────────────────────────────

    [Serializable] public class ApiError
    {
        public string code;
        public string message;
    }

    [Serializable] public class ApiErrorResponse { public ApiError error; }
}
