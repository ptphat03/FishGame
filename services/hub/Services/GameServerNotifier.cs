namespace FishApi.Services;

public interface IGameServerNotifier
{
    Task ReloadConfigAsync();
}

public class GameServerNotifier(IHttpClientFactory factory, IConfiguration config, ILogger<GameServerNotifier> logger)
    : IGameServerNotifier
{
    public async Task ReloadConfigAsync()
    {
        var url    = config["GameServer:InternalUrl"] + "/internal/reload-config";
        var secret = config["GameServer:InternalSecret"];

        try
        {
            var client  = factory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("X-Internal-Secret", secret);
            await client.SendAsync(request);
            logger.LogInformation("[HotReload] Game server config reloaded");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[HotReload] Failed to notify game server");
        }
    }
}
