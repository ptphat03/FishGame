using System.ComponentModel.DataAnnotations;

namespace FishApi.Dtos;

public record DepositRequest(
    [Required, Range(1, long.MaxValue)] long Amount,
    string? Description
);

public record WithdrawRequest(
    [Required, Range(1, long.MaxValue)] long Amount,
    string? Description
);

public record WalletResponse(
    long UserId,
    long Balance,
    DateTime UpdatedAt
);

public record TransactionResponse(
    long Id,
    long UserId,
    long? SessionId,
    long Amount,
    string Type,
    string? Description,
    DateTime CreatedAt
);

public record TransactionListResponse(
    IEnumerable<TransactionResponse> Transactions,
    long Total,
    int Limit,
    int Offset
);
