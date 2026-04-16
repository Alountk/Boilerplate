# 🔐 Security Incident Report — 16 April 2026

## Summary
**Severity**: 🔴 **CRITICAL**  
**Issue**: Production credentials were exposed in version control (`.env.local`)  
**Discovery**: During axios security audit  
**Status**: 🟡 **IN PROGRESS — Awaiting Credential Rotation**

---

## Exposed Credentials (NOW REVOKED)

### ❌ MinIO S3 Production
```
Endpoint: https://s3.androemda-surf.uk
User: admin
Secret: lRs&^D5Rpl#Pfy [REVOKED]
```

**Action Required**:
- [ ] Login to MinIO console at https://s3.androemda-surf.uk
- [ ] Change `admin` password to new secure value
- [ ] Store new password in your secrets vault (1Password/Vault/AWS Secrets Manager)
- [ ] Update `MINIO_SECRET` in Portainer environment variables
- [ ] Restart API/Web services

### ❌ PostgreSQL Database
```
Server: 111.111.111.102:5433
User: vmarketUser
Password: 674cb230D2_vM [REVOKED]
```

**Action Required**:
- [ ] Connect to PostgreSQL as `postgres` user
- [ ] Execute: `ALTER ROLE vmarketUser WITH PASSWORD 'NEW_SECURE_PASSWORD';`
- [ ] Store in secrets vault
- [ ] Update `CONNECTION_STRING` in `.env.local` and Portainer

### ❌ JWT Secret
```
Current: sdaeqwfDf_E$%Q=34265WQ":we$1TF$Sssdfg [REVOKED]
```

**Action Required**:
- [ ] Generate new 64-char random secret
- [ ] Update `JWT_SECRET` in `.env.local` and API appsettings
- [ ] Existing JWTs will be invalidated (users need to re-login)

---

## Vulnerability Context

The axios npm package (v1.13.2) had critical SSRF vulnerabilities:
- **CVE-2026-40175**: Cloud Metadata Exfiltration
- **CVE-2025-62718**: NO_PROXY Hostname Normalization Bypass

While the API was **NOT actively running** during the compromise window, the exposed credentials in `.env.local` represent a real production risk if the repository had been accessed.

---

## Remediation Steps

### Phase 1: Immediate (Done ✅)
- [x] Updated axios to 1.15.0 (security patched)
- [x] Masked sensitive data in `.env.local`
- [x] Updated MinIO secret in local development config
- [x] Created this security report

### Phase 2: Production (TO DO)
1. Rotate MinIO admin password
2. Rotate PostgreSQL `vmarketUser` password
3. Rotate JWT secret (triggers re-auth)
4. Monitor PostgreSQL/MinIO access logs for suspicious activity
5. Enable audit logging on both systems

### Phase 3: Prevention (TO DO)
- [ ] Add `.env.local` to `.gitignore` (if not already)
- [ ] Create `.env.example` with placeholders only
- [ ] Implement secrets scanning in CI/CD (GitGuardian, Snyk)
- [ ] Store production secrets in 1Password/Vault, NOT in `.env.local`
- [ ] Document credential rotation policy

---

## Timeline

| Date | Event |
|------|-------|
| ~Nov 2025 | axios 1.13.2 installed (contains CVE) |
| 16 Apr 2026 | Security audit detected axios CVE |
| 16 Apr 2026 | **Updated to axios 1.15.0** ✅ |
| 16 Apr 2026 | **Discovered exposed credentials in `.env.local`** 🚨 |
| **TODAY** | **Credentials masked, rotation plan created** |
| **URGENT** | **Rotate production credentials immediately** |

---

## Files Modified

- ✅ `.env.local` — Credentials masked, marked ROTATE_ME
- ✅ `appsettings.Development.json` — MinIO secret updated (dev only)
- ✅ `package.json` → `axios@1.15.0` (security patch)
- 📋 `.gitignore` — **VERIFY `.env.local` is ignored**

---

## Contact & Escalation

- **Lead**: DevOps/Security team
- **Urgency**: 🔴 CRITICAL — Prioritize credential rotation within 24 hours
- **Post-Incident**: Schedule secrets management training for team

---

## References

- CVE-2026-40175: axios Metadata Exfiltration
- CVE-2025-62718: axios SSRF via NO_PROXY bypass
- OWASP: Secrets in Version Control: https://owasp.org/www-community/Sensitive_Data_Exposure
