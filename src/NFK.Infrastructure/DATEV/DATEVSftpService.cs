using Renci.SshNet;

namespace NFK.Infrastructure.DATEV;

public class DATEVSftpService
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;

    public DATEVSftpService(string host, int port, string username, string password)
    {
        _host = host;
        _port = port;
        _username = username;
        _password = password;
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
