namespace FishApi.Dtos;

public record LoginResponse(
    string AccessToken,
    long AccessTokenExpiresAt
);

public record RegisterResponse(
    long Id,
    string Username,
    int RoleId
);

public record RefreshResponse(
    string AccessToken,
    long AccessTokenExpiresAt
);

public record MeResponse(
    long Id,
    string Username,
    string Email,
    int RoleId,
    DateTime CreatedAt
);
