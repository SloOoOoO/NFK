# Google OAuth Configuration Guide

This guide explains how to configure Google OAuth authentication for the NFK application.

## Prerequisites

- A Google Cloud Platform account
- Access to the Google Cloud Console
- Admin access to the NFK application configuration

## Configuration Steps

### 1. Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Select "Web application" as the application type
5. Configure the OAuth consent screen if you haven't already

### 2. Add Authorized Redirect URIs

Add the following redirect URIs based on your environment:

**Development:**
```
http://localhost:8080/api/v1/auth/google/callback
```

**Production:**
```
https://your-domain.com/api/v1/auth/google/callback
```

### 3. Copy Your Credentials

After creating the OAuth client, you'll receive:
- Client ID
- Client Secret

**Important:** Keep these credentials secure and never commit them to version control!

### 4. Configure Environment Variables

#### Option 1: Using .env file (Recommended for Development)

Create or update `.env` file in the root directory:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_ENABLED=true
```

#### Option 2: Using System Environment Variables (Production)

Set the following environment variables on your server:

```bash
export GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"
export GOOGLE_OAUTH_ENABLED="true"
```

#### Option 3: Using Docker Environment Variables

If using Docker, add to `docker-compose.yml`:

```yaml
environment:
  - OAuth:Google:ClientId=${GOOGLE_CLIENT_ID}
  - OAuth:Google:ClientSecret=${GOOGLE_CLIENT_SECRET}
  - OAuth:Google:Enabled=true
```

### 5. Verify Configuration

1. Start the application
2. Navigate to the login page
3. You should see a "Mit Google anmelden" (Sign in with Google) button
4. Click the button to test the OAuth flow

## OAuth Flow

### New User Registration Flow (First Time Google Login)

1. User clicks "Mit Google anmelden" button on login page
2. Frontend redirects to `/api/v1/auth/google/login`
3. Backend redirects to Google's OAuth authorization page
4. User authenticates with Google and grants permissions
5. Google redirects back to `/api/v1/auth/google/callback` with authorization code
6. Backend exchanges code for access token
7. Backend retrieves user profile from Google
8. **Backend checks if user exists:**
   - If user exists → Skip to step 9
   - If new user → Continue to registration
9. **For new users:** Backend redirects to `/auth/register` with:
   - `source=google` - Indicates OAuth source
   - `email={google-email}` - Pre-filled email from Google account
   - `providerId={google-sub}` - Google's unique user identifier
10. **Registration form displays with:**
    - Email field pre-filled and disabled (greyed out)
    - Google icon next to email showing "E-Mail-Adresse von Ihrem Google-Konto übernommen"
    - Validation ensures email is not a placeholder
11. User completes remaining required fields (name, address, tax info, etc.)
12. Upon submission, account is created and linked to Google account

### Existing User Login Flow

1. User clicks "Mit Google anmelden" button on login page
2. Frontend redirects to `/api/v1/auth/google/login`
3. Backend redirects to Google's OAuth authorization page
4. User authenticates with Google and grants permissions
5. Google redirects back to `/api/v1/auth/google/callback` with authorization code
6. Backend exchanges code for access token
7. Backend retrieves user profile from Google
8. **Backend finds existing user** (by Google ID or email)
9. Backend generates JWT tokens
10. User is redirected to `/auth/oauth-success` with tokens
11. Frontend stores tokens and redirects to dashboard

### Error Handling

The application includes comprehensive error handling:

**Backend Error Scenarios:**
- **OAuth Not Enabled:** Shows clear error message instead of fallback mode
- **Token Exchange Failures:** Logs detailed error and redirects to login with message
- **User Profile Retrieval Errors:** Handles network/API failures gracefully
- **Missing Authorization Code:** Detects and reports missing OAuth data
- **Database Errors:** Handles user creation/update failures

**Frontend Validation:**
- **Missing OAuth Data:** Validates that email and providerId are present
- **Invalid Email:** Rejects placeholder emails (e.g., user@example.com)
- **Email Domain Validation:** Uses disposable email checker and validates domains

**User-Facing Errors:**
- OAuth configuration errors (when OAuth not enabled)
- Google authentication failures
- Missing authorization codes
- Network/connectivity issues

Error messages are passed to the frontend via query parameters:
```
/auth/login?error=google_failed&message=Error+description
```

## Troubleshooting

### Issue: "Google OAuth not configured"

**Symptoms:** Clicking Google button shows error message: "Google Sign-In ist nicht konfiguriert"

**Solution:**
1. Verify `GOOGLE_OAUTH_ENABLED=true` is set
2. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are properly set
3. Restart the application to reload environment variables

**Note:** The application no longer has a fallback/simulation mode. OAuth must be properly configured to use Google Sign-In.

### Issue: "Redirect URI mismatch"

**Symptoms:** Error from Google: "redirect_uri_mismatch"

**Solution:**
1. Ensure the redirect URI in Google Cloud Console exactly matches your backend URL
2. Check the protocol (http vs https)
3. Verify the port number if using localhost
4. The redirect URI must be: `{YOUR_API_URL}/api/v1/auth/google/callback`

### Issue: "Failed to exchange code for token"

**Symptoms:** Error in logs: "Failed to exchange authorization code for token"

**Solution:**
1. Verify Client Secret is correct
2. Check network connectivity to Google's OAuth servers
3. Ensure the authorization code hasn't expired (codes expire after ~10 minutes)
4. Check system time is synchronized (OAuth uses timestamps)

### Issue: "No access token received"

**Symptoms:** Error: "No access token received from Google"

**Solution:**
1. Check Google Cloud Console for OAuth scope configuration
2. Verify the application is not restricted in Google Cloud Console
3. Review server logs for detailed HTTP responses from Google

## Security Considerations

### Production Checklist

- [ ] Never commit OAuth credentials to version control
- [ ] Use environment variables for all sensitive configuration
- [ ] Enable HTTPS for all OAuth callbacks in production
- [ ] Restrict OAuth client to specific domains in Google Cloud Console
- [ ] Regularly rotate Client Secrets
- [ ] Monitor OAuth logs for suspicious activity
- [ ] Implement rate limiting on OAuth endpoints
- [ ] Validate all redirect URIs
- [ ] Use secure session storage for tokens

### OAuth Scopes

The application requests the following Google scopes:
- `openid` - OpenID Connect authentication
- `email` - User's email address
- `profile` - User's basic profile information (name, photo)

These scopes provide the minimum required information for user authentication.

## Advanced Configuration

### Custom Frontend URL

By default, the application uses `http://localhost:5173` for frontend redirects in development.

To change this, set the `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-frontend-domain.com
```

Or in `appsettings.json`:

```json
{
  "Frontend": {
    "Url": "https://your-frontend-domain.com"
  }
}
```

### Logging Configuration

OAuth operations are logged at different levels:

- **Information**: Successful authentications, user profile retrieval
- **Warning**: OAuth not configured, simulation mode active
- **Error**: Token exchange failures, user profile errors, unexpected errors

To enable debug logging for OAuth:

```json
{
  "Logging": {
    "LogLevel": {
      "NFK.Application.Services.OAuth": "Debug"
    }
  }
}
```

## Testing

### Manual Testing Checklist

1. [ ] Google login button appears on login page
2. [ ] Clicking button redirects to Google
3. [ ] Google login page appears correctly
4. [ ] After authentication, user is redirected back to application
5. [ ] User profile is created/updated correctly
6. [ ] JWT tokens are generated and stored
7. [ ] User is redirected to dashboard
8. [ ] User can access protected routes
9. [ ] Error messages are displayed clearly on failures

### Test Error Scenarios

1. **Cancel Authentication:** Click Google button but cancel on Google's page
2. **Invalid Credentials:** Test with incorrect Client Secret (should log error)
3. **Network Failure:** Test with Google APIs unavailable
4. **Expired Code:** Test with a code that's already been used

## Support

For issues with OAuth configuration:

1. Check application logs in `logs/nfk-*.log`
2. Enable debug logging for detailed OAuth flow information
3. Verify all configuration steps were completed
4. Review Google Cloud Console audit logs
5. Consult Google OAuth 2.0 documentation: https://developers.google.com/identity/protocols/oauth2

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)
