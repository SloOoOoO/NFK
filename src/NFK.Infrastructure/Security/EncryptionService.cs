using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace NFK.Infrastructure.Security;

/// <summary>
/// Encrypts and decrypts sensitive PII data at rest using AES-256-GCM (authenticated encryption).
/// </summary>
/// <remarks>
/// Key derivation: PBKDF2-SHA256 with 100,000 iterations.
/// The PBKDF2 salt <c>"NFK.Steuerberatung.Salt"</c> is intentionally static because it is used to
/// derive a symmetric key from a secret master password — not to protect a password hash. The
/// master key itself is the secret; a static derivation salt is standard practice here (analogous
/// to HKDF info bytes). In a higher-security context the salt could be read from an environment
/// variable; configure <c>Encryption:DerivationSalt</c> to override if required.
/// </remarks>
public class EncryptionService
{
    private readonly byte[] _key;
    private readonly ILogger<EncryptionService> _logger;
    private const int NonceSize = 12; // 96 bits for GCM
    private const int TagSize = 16;   // 128-bit authentication tag
    
    /// <summary>
    /// Initialises the service and derives the AES-256 key from the configured master key.
    /// </summary>
    /// <param name="configuration">Application configuration (reads <c>Encryption:MasterKey</c>).</param>
    /// <param name="logger">Logger instance for diagnostic and error messages.</param>
    public EncryptionService(IConfiguration configuration, ILogger<EncryptionService> logger)
    {
        _logger = logger;

        // In production this MUST come from Azure Key Vault, AWS Secrets Manager, or an
        // equivalent secrets manager — never from a committed configuration file.
        var keyString = configuration["Encryption:MasterKey"] 
            ?? Environment.GetEnvironmentVariable("ENCRYPTION_MASTER_KEY");
        
        if (string.IsNullOrEmpty(keyString))
        {
            throw new InvalidOperationException(
                "Encryption master key is not configured. Set Encryption:MasterKey in configuration " +
                "or the ENCRYPTION_MASTER_KEY environment variable.");
        }
        
        _key = DeriveKey(keyString, configuration);
    }
    
    /// <summary>Derives a 256-bit AES key from the master key string using PBKDF2-SHA256.</summary>
    private byte[] DeriveKey(string keyString, IConfiguration configuration)
    {
        // The derivation salt is intentionally static (see class remarks).
        // Override via Encryption:DerivationSalt for additional configurability.
        var salt = configuration["Encryption:DerivationSalt"] ?? "NFK.Steuerberatung.Salt";
        using var pbkdf2 = new Rfc2898DeriveBytes(
            Encoding.UTF8.GetBytes(keyString),
            Encoding.UTF8.GetBytes(salt),
            100_000,
            HashAlgorithmName.SHA256);
        
        return pbkdf2.GetBytes(32); // 256 bits
    }
    
    /// <summary>
    /// Encrypts <paramref name="plaintext"/> using AES-256-GCM.
    /// Returns <see langword="null"/> or an empty string unchanged.
    /// </summary>
    /// <param name="plaintext">The plaintext to encrypt.</param>
    /// <returns>Base64-encoded ciphertext (nonce + tag + ciphertext), or <see langword="null"/> on failure.</returns>
    public string? Encrypt(string? plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;
        
        try
        {
            var nonce = RandomNumberGenerator.GetBytes(NonceSize);
            var tag = new byte[TagSize];
            var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            var ciphertext = new byte[plaintextBytes.Length];
            
            using var aesGcm = new AesGcm(_key, TagSize);
            aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);
            
            // Combine nonce + tag + ciphertext into a single Base64 blob
            var result = new byte[NonceSize + TagSize + ciphertext.Length];
            Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
            Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
            Buffer.BlockCopy(ciphertext, 0, result, NonceSize + TagSize, ciphertext.Length);
            
            return Convert.ToBase64String(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Encryption failed");
            return null;
        }
    }
    
    /// <summary>
    /// Decrypts a Base64-encoded ciphertext produced by <see cref="Encrypt"/>.
    /// Returns <see langword="null"/> or an empty string unchanged.
    /// </summary>
    /// <param name="ciphertext">Base64-encoded encrypted blob.</param>
    /// <returns>Decrypted plaintext, or <see langword="null"/> if decryption fails.</returns>
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Decryption failed");
            return null;
        }
    }

    /// <summary>
    /// Attempts to decrypt <paramref name="value"/>; returns the original value unchanged when
    /// decryption fails (e.g., for legacy plaintext data that has not yet been migrated).
    /// </summary>
    /// <param name="value">An encrypted Base64 blob or a legacy plaintext value.</param>
    /// <returns>Decrypted string, or the original <paramref name="value"/> as a fallback.</returns>
    public string? SafeDecrypt(string? value) => Decrypt(value) ?? value;
}
