# Security Configuration

This document outlines the security setup implemented in NewsGen AI to protect user data and ensure secure operation.

## Overview

NewsGen AI implements enterprise-grade security features including:
- User authentication with Supabase Auth
- Row Level Security (RLS) for database access control
- Environment variable-based configuration
- Secure session management
- Private data isolation

## Authentication

### Supabase Authentication

The application uses Supabase Auth for user management:

- **Email/Password Authentication** - Secure user signup and login
- **JWT-Based Sessions** - Automatic token management and refresh
- **Secure Password Storage** - Passwords are hashed and never stored in plain text
- **Session Persistence** - Users stay logged in across browser sessions

### Implementation

Authentication is managed through the `AuthContext` (`src/contexts/AuthContext.tsx`):

```typescript
const { user, session, signUp, signIn, signOut } = useAuth();
```

All authenticated routes check for a valid session before rendering protected content.

## Database Security

### Row Level Security (RLS)

Every database table has RLS enabled with policies that ensure:

1. **Users can only access their own data**
2. **All operations require authentication**
3. **No public access to sensitive data**

### Database Schema

#### Profiles Table
- Links to Supabase `auth.users`
- Stores user email and timestamps
- RLS policies:
  - Users can view their own profile
  - Users can update their own profile
  - Users can insert their own profile (on signup)

#### Search History Table
- Stores user search queries
- References user profile with foreign key
- RLS policies:
  - Users can view their own search history
  - Users can insert their own searches
  - Users can delete their own search history

#### Generated Articles Table
- Stores AI-generated articles
- References user profile with foreign key
- Includes status tracking (generating, ready, error)
- RLS policies:
  - Users can view their own articles
  - Users can insert their own articles
  - Users can update their own articles
  - Users can delete their own articles

### Policy Examples

```sql
-- Users can only view their own articles
CREATE POLICY "Users can view own articles"
  ON generated_articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert articles for themselves
CREATE POLICY "Users can insert own articles"
  ON generated_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Environment Variables

Sensitive configuration is stored in environment variables and never committed to source control.

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Make.com Webhooks
VITE_WEBHOOK_NEWS_SCRAPE=your_news_scrape_webhook_url
VITE_WEBHOOK_SCRAPE_TO_ARTICLE=your_article_generation_webhook_url
```

### Security Best Practices

1. **Never commit `.env` files** - Included in `.gitignore`
2. **Use `.env.example` for documentation** - Template without sensitive data
3. **Rotate keys regularly** - Update API keys periodically
4. **Use read-only keys when possible** - Supabase anon key has limited permissions

## Data Isolation

### User Data Separation

Each user's data is completely isolated:

- **Articles** - Only accessible by the creating user
- **Search History** - Private to each user
- **Profile Information** - User-specific and protected

### Database-Level Enforcement

RLS policies are enforced at the database level, meaning:

- Even if frontend code has bugs, users cannot access other users' data
- API calls automatically filter by authenticated user
- No additional authorization logic needed in application code

## API Security

### Webhook URLs

Make.com webhook URLs are stored as environment variables to:

- Prevent exposure in client-side code
- Allow easy rotation if compromised
- Enable different URLs for dev/staging/production

### Supabase API

The Supabase anon key is safe to expose in client-side code because:

- RLS policies enforce all access control
- The key only allows operations permitted by RLS
- No admin operations are possible with the anon key

## Session Management

### JWT Tokens

- Automatically managed by Supabase Auth
- Stored securely in localStorage
- Refreshed automatically before expiration
- Invalidated on sign out

### Session Duration

- Sessions persist until explicit sign out
- Tokens refresh automatically
- No manual token management required

## Secure Development Practices

### Code Review Checklist

When adding new features, ensure:

1. ✅ All database operations use authenticated user ID
2. ✅ New tables have RLS enabled
3. ✅ RLS policies follow principle of least privilege
4. ✅ Sensitive data never logged to console
5. ✅ API keys never hardcoded
6. ✅ User input properly validated

### Testing Security

Test RLS policies by:

1. Creating multiple user accounts
2. Verifying users can only see their own data
3. Attempting to access other users' data (should fail)
4. Testing unauthenticated access (should be blocked)

## Incident Response

### If a Key is Compromised

1. **Immediately rotate the compromised key**
2. **Update environment variables in all environments**
3. **Review access logs for suspicious activity**
4. **Force password reset for affected users (if auth key)**

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public GitHub issue
2. Email: irvin@futurecrafters.ai
3. Include detailed description and reproduction steps
4. Allow time for fix before public disclosure

## Compliance

### Data Privacy

- **User Consent** - Users create accounts voluntarily
- **Data Ownership** - Users own their generated content
- **Right to Deletion** - Users can delete their accounts and data
- **Data Minimization** - Only essential data is collected

### Security Standards

- ✅ Passwords hashed with bcrypt
- ✅ HTTPS encryption in transit
- ✅ Database-level access control (RLS)
- ✅ Secure session management (JWT)
- ✅ Environment-based configuration

## Monitoring

### Security Monitoring

Monitor for:

- Failed login attempts
- Unusual API usage patterns
- Database query errors (may indicate RLS issues)
- Session token issues

### Logging

- Authentication events logged by Supabase
- Application errors logged to console
- Sensitive data never included in logs

## Updates and Maintenance

### Regular Security Tasks

- [ ] Monthly: Review and rotate API keys
- [ ] Quarterly: Audit RLS policies
- [ ] Quarterly: Update dependencies (security patches)
- [ ] Annually: Security assessment and penetration testing

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Last Updated:** February 2026
**Maintained by:** [FutureCrafters](https://futurecrafters.ai)
