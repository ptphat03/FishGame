using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FishApi.Dtos;
using FishApi.Services;

namespace FishApi.Controllers.Player;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _wallet;

    public WalletController(IWalletService wallet) => _wallet = wallet;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(Error("INVALID_TOKEN", "Không lấy được user_id"));

        var result = await _wallet.GetWalletAsync(userId.Value);
        return Ok(new { data = result });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(Error("INVALID_TOKEN", "Không lấy được user_id"));

        var result = await _wallet.GetTransactionsAsync(userId.Value, limit, offset);
        return Ok(new { data = result });
    }

    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest req)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(Error("INVALID_TOKEN", "Không lấy được user_id"));

        try
        {
            var result = await _wallet.DepositAsync(userId.Value, req);
            return Ok(new { data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Error("WALLET_NOT_FOUND", ex.Message));
        }
    }

    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest req)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized(Error("INVALID_TOKEN", "Không lấy được user_id"));

        try
        {
            var result = await _wallet.WithdrawAsync(userId.Value, req);
            return Ok(new { data = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(Error("INSUFFICIENT_BALANCE", ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(Error("WALLET_NOT_FOUND", ex.Message));
        }
    }

    private long? GetUserId()
    {
        var claim = User.FindFirst("user_id")?.Value;
        return long.TryParse(claim, out var id) ? id : null;
    }

    private static object Error(string code, string message) =>
        new { error = new { code, message } };
}
