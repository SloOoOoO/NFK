namespace NFK.Application.Exceptions;

/// <summary>
/// Thrown when a login attempt is made with an email address that has not yet been verified.
/// Handled separately from other <see cref="UnauthorizedAccessException"/> cases so the
/// API can return a distinct error code (<c>email_not_verified</c>) to the frontend.
/// </summary>
public class EmailNotVerifiedException : UnauthorizedAccessException
{
    public EmailNotVerifiedException()
        : base("Please verify your email address before logging in. Check your inbox for the verification email.")
    {
    }

    public EmailNotVerifiedException(string message)
        : base(message)
    {
    }
}
