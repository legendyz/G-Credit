# External Validator Testing Guide

**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Purpose:** Validate Open Badges 2.0 compliance with external platforms  
**Target Platforms:** Open Badges Validator, Credly, Badgr  
**Last Updated:** 2026-01-28

---

## 📋 Overview

This guide provides step-by-step instructions for testing G-Credit badges with external Open Badges 2.0 validators and platforms to ensure interoperability and standards compliance.

**Testing Goals:**
- ✅ JSON-LD assertions pass official Open Badges Validator
- ✅ Baked badges can be imported to Credly
- ✅ Baked badges can be imported to Badgr
- ✅ Verification URLs are publicly accessible
- ✅ Badge metadata is correctly formatted

---

## 🧪 Test 1: Open Badges Validator (IMS Global)

### URL
https://openbadgesvalidator.imsglobal.org/

### Purpose
Official validator from IMS Global (creators of Open Badges specification)

### Steps

**1. Prepare Test Badge:**
```powershell
# Generate a test badge assertion (Story 6.1)
curl http://localhost:3000/api/badges/test-badge-123/assertion > test-assertion.json
```

**2. Validate JSON-LD:**
- Visit: https://openbadgesvalidator.imsglobal.org/
- Select "Open Badges 2.0"
- Upload `test-assertion.json` OR paste JSON
- Click "Validate"

**Expected Result:**
```
✅ Valid Open Badges 2.0 Assertion
✅ All required fields present
✅ @context matches specification
✅ recipient.identity is properly hashed
✅ verification.verificationUrl is reachable
```

**Common Validation Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing required field: @context" | JSON missing @context | Add `"@context": "https://w3id.org/openbadges/v2"` |
| "Invalid recipient.identity" | Email not hashed | Use SHA-256(email + salt) |
| "badge field must be a URL" | Using ID instead of URL | Change to full URL: `https://g-credit.com/api/badge-templates/{id}` |
| "issuedOn format invalid" | Date not ISO 8601 | Use format: `2026-01-28T10:30:00Z` |
| "verification.verificationUrl not found" | URL returns 404 | Ensure public route accessible |

**3. Download Validation Report:**
- Click "Download Report"
- Save as `validation-report-{date}.html`
- Store in: `gcredit-project/docs/sprints/sprint-5/validation-reports/`

---

## 🧪 Test 2: Verification URL Public Access

### Purpose
Ensure verification URLs work without authentication

### Steps

**1. Get Verification URL:**
```powershell
# From badge assertion
$verificationUrl = "https://g-credit.com/verify/abc-123-def-456"
```

**2. Test from Incognito/Private Browser:**
- Open incognito/private window (no cookies/session)
- Navigate to verification URL
- Should NOT redirect to login

**3. Test with curl (No cookies):**
```powershell
curl -I https://g-credit.com/verify/abc-123-def-456
# Expected: HTTP/1.1 200 OK
# NOT: HTTP/1.1 401 Unauthorized
```

**4. Test CORS:**
```powershell
curl -H "Origin: https://external-site.com" `
     -H "Access-Control-Request-Method: GET" `
     -H "Access-Control-Request-Headers: Content-Type" `
     -X OPTIONS `
     https://g-credit.com/api/verify/abc-123-def-456

# Expected headers:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET
```

---

## 🧪 Test 3: Credly Badge Import

### URL
https://www.credly.com/ (requires account)

### Steps

**1. Create Credly Account:**
- Visit https://www.credly.com/
- Sign up for free account

**2. Prepare Baked Badge:**
```powershell
# Download baked badge (Story 6.4)
curl http://localhost:3000/api/badges/test-badge-123/download/png -o baked-badge.png
```

**3. Import to Credly:**
- Login to Credly
- Go to "My Badges" → "Add Badge"
- Select "Upload from Computer"
- Choose `baked-badge.png`
- Click "Import"

**Expected Result:**
```
✅ Badge imported successfully
✅ Badge name displays correctly
✅ Issuer shows "G-Credit"
✅ Issuance date matches
✅ Skills/criteria visible
```

**Common Import Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid badge file" | iTXt chunk missing | Verify sharp iTXt embedding (see sharp-installation-guide.md) |
| "Badge already exists" | Duplicate assertion.id | Use unique ID per badge |
| "Issuer not recognized" | Issuer URL not accessible | Ensure issuer profile is public |
| "Verification failed" | verificationUrl returns 404 | Check public route configuration |

**4. Verify Badge Display:**
- Click imported badge in Credly
- Verify all fields match G-Credit data
- Test "Verify" button → should redirect to G-Credit verification page

---

## 🧪 Test 4: Badgr Badge Import

### URL
https://badgr.com/ (requires account)

### Steps

**1. Create Badgr Account:**
- Visit https://badgr.com/
- Sign up for free account

**2. Import Baked Badge:**
- Login to Badgr
- Go to "Collections" → "Import Badge"
- Upload `baked-badge.png`
- Click "Import Badge"

**Expected Result:**
```
✅ Badge imported successfully
✅ Badge details extracted from iTXt chunk
✅ Verification URL clickable
✅ Badge shareable on Badgr platform
```

**3. Verify Badge Details:**
- Open imported badge
- Check: Name, Issuer, Description, Criteria
- Click "Verify Badge" → should show "Verified" status

---

## 🧪 Test 5: JSON-LD Playground

### URL
https://json-ld.org/playground/

### Purpose
Validate JSON-LD structure and linked data

### Steps

**1. Load Assertion:**
- Visit https://json-ld.org/playground/
- Paste badge assertion JSON
- Click "Prettify"

**2. Check Compacted Form:**
- Tab: "Compacted"
- Verify @context expands correctly
- All URLs should resolve

**3. Check Expanded Form:**
- Tab: "Expanded"
- Verify semantic meaning preserved
- recipient.identity should show as fully qualified URI

**Expected Expanded Form Sample:**
```json
[
  {
    "@type": [
      "https://w3id.org/openbadges#Assertion"
    ],
    "https://w3id.org/openbadges#recipient": [
      {
        "@type": [
          "https://w3id.org/openbadges#email"
        ],
        "https://w3id.org/openbadges#hashed": [
          {
            "@value": true
          }
        ],
        "https://w3id.org/openbadges#identity": [
          {
            "@value": "sha256$abc123..."
          }
        ]
      }
    ]
  }
]
```

---

## 🧪 Test 6: Social Media Sharing Preview

### Facebook Sharing Debugger

**URL:** https://developers.facebook.com/tools/debug/

**Steps:**
1. Enter verification URL: `https://g-credit.com/verify/abc-123`
2. Click "Debug"
3. Verify Open Graph tags loaded:
   - og:title shows badge name
   - og:image shows badge image (512x512px minimum)
   - og:description shows criteria
4. Click "Scrape Again" to refresh cache
5. Preview shows correctly formatted card

### Twitter Card Validator

**URL:** https://cards-dev.twitter.com/validator

**Steps:**
1. Enter verification URL
2. Click "Preview Card"
3. Verify Twitter Card displays:
   - Card type: "summary_large_image"
   - Badge image prominent
   - Badge name as title

### LinkedIn Share Preview

**Steps:**
1. Create test post on LinkedIn
2. Paste verification URL
3. Wait for preview to generate
4. Verify badge image and text display

---

## 📊 Test Matrix

| Test | Platform | Pass Criteria | Priority |
|------|----------|---------------|----------|
| JSON-LD Validation | IMS Global Validator | No errors | 🔴 Critical |
| Public URL Access | Browser (incognito) | 200 OK, no login redirect | 🔴 Critical |
| CORS Headers | curl | Allow-Origin: * | 🔴 Critical |
| Baked Badge Import | Credly | Badge imported & verifies | 🟡 High |
| Baked Badge Import | Badgr | Badge imported & verifies | 🟡 High |
| JSON-LD Expansion | JSON-LD Playground | Valid linked data | 🟢 Medium |
| Facebook Preview | FB Sharing Debugger | OG tags correct | 🟢 Medium |
| Twitter Preview | Twitter Card Validator | Card displays | 🟢 Medium |

---

## 🐛 Troubleshooting

### Issue: Validator Says "URL Not Reachable"

**Symptom:** verification.verificationUrl returns 404 or timeout

**Debug Steps:**
```powershell
# 1. Test locally
curl http://localhost:3000/verify/test-id
# Should return 200

# 2. Test public domain
curl https://g-credit.com/verify/test-id
# Should return 200

# 3. Check DNS resolution
nslookup g-credit.com
# Should resolve to correct IP

# 4. Check firewall/security groups
# Ensure port 443 (HTTPS) is open
```

**Solution:**
- Ensure frontend is deployed and accessible
- Verify verification routes are registered
- Check @Public() decorator on controller methods

---

### Issue: Baked Badge Not Importing

**Symptom:** Credly/Badgr says "Invalid badge file"

**Debug Steps:**
```powershell
# 1. Check PNG file validity
file baked-badge.png
# Expected: PNG image data

# 2. Extract iTXt chunk using exiftool
exiftool -b -openbadges baked-badge.png
# Should output JSON-LD assertion

# 3. Validate extracted JSON
exiftool -b -openbadges baked-badge.png | jq .
# Should be valid JSON
```

**Solution:**
- Verify sharp iTXt embedding works (see sharp-installation-guide.md)
- Ensure assertion JSON is valid before baking
- Check PNG file size (<5MB)

---

### Issue: Open Graph Preview Not Showing

**Symptom:** Facebook/Twitter shows blank or generic preview

**Debug Steps:**
```powershell
# 1. Check meta tags in HTML
curl https://g-credit.com/verify/test-id | Select-String "og:title"
# Should find og:title meta tag

# 2. Validate Open Graph
# Use: https://www.opengraph.xyz/
# Enter verification URL

# 3. Check image URL accessibility
curl -I https://gcreditdevstoragelz.blob.core.windows.net/badges/badge-image.png
# Should return 200 OK
```

**Solution:**
- Ensure all og: meta tags in <head>
- Badge image URL must be absolute (https://)
- Image must be publicly accessible (no auth)
- Image size: minimum 200x200px, recommended 1200x630px

---

## ✅ Testing Checklist

### Story 6.1 (JSON-LD Generation)
- [ ] Assertion validates on IMS Global Validator (no errors)
- [ ] All required fields present (@context, type, id, recipient, badge, issuedOn, verification)
- [ ] Optional fields included when available (evidence, expires, narrative)
- [ ] Recipient email properly hashed (SHA-256 + salt)
- [ ] JSON-LD expands correctly in playground

### Story 6.2 (Public Verification Page)
- [ ] Verification URL accessible without login (incognito test)
- [ ] Page displays all badge details
- [ ] Revoked badges show red warning banner
- [ ] Open Graph meta tags present and valid
- [ ] Mobile responsive (tested on 375px, 768px, 1024px)

### Story 6.3 (Verification API)
- [ ] API endpoint returns 200 for valid badges
- [ ] API endpoint returns 404 for invalid verificationId
- [ ] CORS headers present (Access-Control-Allow-Origin: *)
- [ ] Rate limiting enforced (429 after 1000 requests)
- [ ] Cache-Control headers correct (1h for valid, no-cache for revoked)

### Story 6.4 (Baked Badge PNG)
- [ ] Badge imports successfully to Credly
- [ ] Badge imports successfully to Badgr
- [ ] iTXt chunk extractable with exiftool
- [ ] Baked badge file size <5MB
- [ ] Original image quality maintained

### Story 6.5 (Immutability)
- [ ] Immutable field update returns 403 Forbidden
- [ ] metadataHash verifies assertion integrity
- [ ] Hash mismatch detected on tampering

---

## 📚 References

- **Open Badges Validator:** https://openbadgesvalidator.imsglobal.org/
- **Credly:** https://www.credly.com/
- **Badgr:** https://badgr.com/
- **JSON-LD Playground:** https://json-ld.org/playground/
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **Open Graph Checker:** https://www.opengraph.xyz/

---

**Status:** ✅ Ready for Sprint 5 Integration Testing  
**Last Updated:** 2026-01-28  
**Owner:** LegendZhu
