using System.Security.Cryptography;
using System.Text;

namespace NFK.Infrastructure.Security;

/// <summary>
/// Time-based One-Time Password (TOTP) service for MFA
/// Based on RFC 6238
/// </summary>
public class TotpService
{
    private const int TimeStep = 30; // 30 seconds
    private const int CodeDigits = 6;
    
    /// <summary>
    /// Generates a new secret key for TOTP
    /// </summary>
    public string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(20); // 160 bits
        return Base32Encode(bytes);
    }
    
    /// <summary>
    /// Generates TOTP code from secret
    /// </summary>
    public string GenerateCode(string secret)
    {
        var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var timeCounter = unixTimestamp / TimeStep;
        
        return GenerateCodeAtCounter(secret, timeCounter);
    }
    
    /// <summary>
    /// Validates TOTP code
    /// </summary>
    public bool ValidateCode(string secret, string code, int windowSize = 1)
    {
        var unixTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var timeCounter = unixTimestamp / TimeStep;
        
        // Check current time and surrounding windows
        for (int i = -windowSize; i <= windowSize; i++)
        {
            var expectedCode = GenerateCodeAtCounter(secret, timeCounter + i);
            if (expectedCode == code)
                return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Generates a QR code URL for authenticator apps
    /// </summary>
    public string GenerateQrCodeUrl(string email, string secret, string issuer = "NFK Steuerberatung")
    {
        var encodedIssuer = Uri.EscapeDataString(issuer);
        var encodedEmail = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}?secret={secret}&issuer={encodedIssuer}";
    }
    
    /// <summary>
    /// Generates backup codes for account recovery
    /// NOTE: Caller must hash these codes using PasswordHasher before storing in database
    /// Return plaintext codes to user once, then store only hashed versions
    /// </summary>
    public string[] GenerateBackupCodes(int count = 10)
    {
        var codes = new string[count];
        for (int i = 0; i < count; i++)
        {
            var bytes = RandomNumberGenerator.GetBytes(5);
            codes[i] = BitConverter.ToString(bytes).Replace("-", "").ToUpper();
        }
        return codes;
    }
    
    private string GenerateCodeAtCounter(string secret, long counter)
    {
        var secretBytes = Base32Decode(secret);
        var counterBytes = BitConverter.GetBytes(counter);
        
        if (BitConverter.IsLittleEndian)
            Array.Reverse(counterBytes);
        
        using var hmac = new HMACSHA1(secretBytes);
        var hash = hmac.ComputeHash(counterBytes);
        
        var offset = hash[hash.Length - 1] & 0x0F;
        var binary = ((hash[offset] & 0x7F) << 24)
                   | ((hash[offset + 1] & 0xFF) << 16)
                   | ((hash[offset + 2] & 0xFF) << 8)
                   | (hash[offset + 3] & 0xFF);
        
        var otp = binary % (int)Math.Pow(10, CodeDigits);
        return otp.ToString().PadLeft(CodeDigits, '0');
    }
    
    private static string Base32Encode(byte[] data)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var result = new StringBuilder();
        
        for (int i = 0; i < data.Length; i += 5)
        {
            var buffer = 0L;
            
            var bitsLeft = 0;
            
            for (int j = 0; j < 5 && i + j < data.Length; j++)
            {
                buffer = (buffer << 8) | data[i + j];
                bitsLeft += 8;
            }
            
            while (bitsLeft >= 5)
            {
                var index = (buffer >> (bitsLeft - 5)) & 0x1F;
                result.Append(alphabet[(int)index]);
                bitsLeft -= 5;
            }
            
            if (bitsLeft > 0)
            {
                var index = (buffer << (5 - bitsLeft)) & 0x1F;
                result.Append(alphabet[(int)index]);
            }
        }
        
        return result.ToString();
    }
    
    private static byte[] Base32Decode(string input)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        input = input.ToUpper().Replace(" ", "").Replace("-", "");
        
        var bytes = new List<byte>();
        var buffer = 0;
        var bitsLeft = 0;
        
        foreach (var c in input)
        {
            var value = alphabet.IndexOf(c);
            if (value < 0)
            {
                throw new ArgumentException($"Invalid Base32 character: {c}", nameof(input));
            }
            
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            
            if (bitsLeft >= 8)
            {
                bytes.Add((byte)(buffer >> (bitsLeft - 8)));
                bitsLeft -= 8;
            }
        }
        
        return bytes.ToArray();
    }
}
