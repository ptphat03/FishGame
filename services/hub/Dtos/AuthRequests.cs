using System.ComponentModel.DataAnnotations;

namespace FishApi.Dtos;

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record RegisterRequest(
    [Required] string Username,
    [Required] string Password,
    [Required, EmailAddress] string Email
);
