using Renci.SshNet;

namespace NFK.Infrastructure.DATEV;

public class DATEVSftpService : IDisposable
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private string _password;
    private bool _disposed;

    public DATEVSftpService(string host, int port, string username, string password)
    {
        _host = host;
        _port = port;
        _username = username;
        _password = password;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // Clear sensitive data
                _password = string.Empty;
            }
            _disposed = true;
        }
    }

    public async Task<bool> UploadFileAsync(string localFilePath, string remoteFilePath)
    {
        try
        {
            using var client = new SftpClient(_host, _port, _username, _password);
            client.Connect();

            await using var fileStream = File.OpenRead(localFilePath);
            client.UploadFile(fileStream, remoteFilePath, true);

            client.Disconnect();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            using var client = new SftpClient(_host, _port, _username, _password);
            client.Connect();
            var isConnected = client.IsConnected;
            client.Disconnect();
            return isConnected;
        }
        catch
        {
            return false;
        }
    }
}
