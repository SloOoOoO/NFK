using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace NFK.Infrastructure.Security;

/// <summary>
/// Service for encrypting and decrypting sensitive data (PII) using AES-256-GCM
/// </summary>
public class EncryptionService
{
    private readonly byte[] _key;
    private const int NonceSize = 12; // 96 bits for GCM
    private const int TagSize = 16;   // 128 bits authentication tag
    
    public EncryptionService(IConfiguration configuration)
    {
        // In production, this should come from Azure Key Vault or secure key management
        var keyString = configuration["Encryption:MasterKey"] 
            ?? Environment.GetEnvironmentVariable("ENCRYPTION_MASTER_KEY")
            ?? "DefaultInsecureKeyForDevelopment32Chars!"; // Must be 32 bytes for AES-256
        
        _key = DeriveKey(keyString);
    }
    
    private byte[] DeriveKey(string keyString)
    {
        // Use PBKDF2 to derive a proper 256-bit key
        using var pbkdf2 = new Rfc2898DeriveBytes(
            Encoding.UTF8.GetBytes(keyString),
            Encoding.UTF8.GetBytes("NFK.Steuerberatung.Salt"), // Static salt for key derivation
            100000, // iterations
            HashAlgorithmName.SHA256);
        
        return pbkdf2.GetBytes(32); // 256 bits
    }
    
    /// <summary>
    /// Encrypts plaintext using AES-256-GCM
    /// </summary>
    public string? Encrypt(string? plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;
        
        try
        {
            var nonce = RandomNumberGenerator.GetBytes(NonceSize);
            var tag = new byte[TagSize];
            var ciphertext = new byte[Encoding.UTF8.GetByteCount(plaintext)];
            
            using var aesGcm = new AesGcm(_key, TagSize);
            aesGcm.Encrypt(nonce, Encoding.UTF8.GetBytes(plaintext), ciphertext, tag);
            
            // Combine nonce + tag + ciphertext
            var result = new byte[NonceSize + TagSize + ciphertext.Length];
            Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
            Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
            Buffer.BlockCopy(ciphertext, 0, result, NonceSize + TagSize, ciphertext.Length);
            
            return Convert.ToBase64String(result);
        }
        catch
        {
            // Log error in production
            return null;
        }
    }
    
    /// <summary>
    /// Decrypts ciphertext using AES-256-GCM
    /// </summary>
    public string? Decrypt(string? ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;
        
        try
        {
            var encryptedData = Convert.FromBase64String(ciphertext);
            
            if (encryptedData.Length < NonceSize + TagSize)
                return null;
            
            var nonce = new byte[NonceSize];
            var tag = new byte[TagSize];
            var encrypted = new byte[encryptedData.Length - NonceSize - TagSize];
            var plaintext = new byte[encrypted.Length];
            
            Buffer.BlockCopy(encryptedData, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(encryptedData, NonceSize, tag, 0, TagSize);
            Buffer.BlockCopy(encryptedData, NonceSize + TagSize, encrypted, 0, encrypted.Length);
            
            using var aesGcm = new AesGcm(_key, TagSize);
            aesGcm.Decrypt(nonce, encrypted, tag, plaintext);
            
            return Encoding.UTF8.GetString(plaintext);
        }
        catch
        {
            // Log error in production
            return null;
        }
    }
}
