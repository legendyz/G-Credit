# SEO & Open Graph Setup Guide

**Sprint:** Sprint 5 (Epic 6 - Badge Verification)  
**Purpose:** Configure SEO and social sharing for verification pages  
**Last Updated:** 2026-01-28

---

## 📋 Overview

This guide configures SEO optimization and Open Graph meta tags for badge verification pages to ensure rich previews when shared on social media (LinkedIn, Facebook, Twitter).

**Goals:**
- ✅ Verification pages rank well in Google search
- ✅ Rich previews on social media
- ✅ Badge images display prominently
- ✅ Accurate metadata for crawlers

---

## 🌐 HTML Meta Tags Implementation

### Base Meta Tags (All Pages)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Basic SEO -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{badgeName}} - Verified Credential | G-Credit</title>
  <meta name="description" content="{{badgeDescription}}">
  <meta name="keywords" content="{{skills}}, digital badge, credential, verified">
  <meta name="author" content="G-Credit">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://g-credit.com/verify/{{verificationId}}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
</head>
</html>
```

---

### Open Graph Meta Tags (Facebook, LinkedIn)

```html
<!-- Open Graph Protocol -->
<meta property="og:title" content="{{badgeName}} - Verified Credential">
<meta property="og:description" content="{{badgeDescription | truncate 200}}">
<meta property="og:image" content="{{badgeImageUrl | absolute}}">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="{{badgeName}} badge image">
<meta property="og:url" content="https://g-credit.com/verify/{{verificationId}}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="G-Credit">
<meta property="og:locale" content="en_US">

<!-- Additional OG Tags -->
<meta property="article:published_time" content="{{issuedDate | iso8601}}">
<meta property="article:author" content="{{issuerName}}">
<meta property="article:section" content="Education">
<meta property="article:tag" content="{{skill1}}">
<meta property="article:tag" content="{{skill2}}">
```

---

### Twitter Card Meta Tags

```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@GCredit">
<meta name="twitter:creator" content="@GCredit">
<meta name="twitter:title" content="{{badgeName}} - Verified Credential">
<meta name="twitter:description" content="{{badgeDescription | truncate 200}}">
<meta name="twitter:image" content="{{badgeImageUrl | absolute}}">
<meta name="twitter:image:alt" content="{{badgeName}} badge">
```

**Card Types:**
- `summary`: Small image (120x120px)
- `summary_large_image`: Large image (280x150px minimum) ✅ **Use this**
- `app`: Mobile app promotion
- `player`: Video/audio player

---

### LinkedIn-Specific Tags

```html
<!-- LinkedIn -->
<meta property="og:title" content="{{badgeName}}">
<meta property="og:description" content="Issued by {{issuerName}} on {{issuedDate}}">
<meta property="og:image" content="{{badgeImageUrl | absolute}}">
<meta property="og:type" content="article">
```

**LinkedIn Requirements:**
- Image: Minimum 1200×627px (recommended: 1200×627px exactly)
- Image format: JPG, PNG, GIF
- Image size: <5MB
- Must be publicly accessible (no auth)

---

## 🖼️ Image Optimization

### Badge Image Requirements

**Dimensions:**
- Original badge: 512×512px (square)
- Social sharing: 1200×630px (1.91:1 ratio) - **Need to generate**

**Strategy:**
```typescript
// Generate social sharing image from badge
async function generateSocialImage(badgeImageUrl: string, badgeData: Badge) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  ctx.fillStyle = '#10b981';  // Green for valid badges
  ctx.fillRect(0, 0, 1200, 630);
  
  // Badge image (centered left)
  const badgeImg = await loadImage(badgeImageUrl);
  ctx.drawImage(badgeImg, 100, 115, 400, 400);
  
  // Badge name (right side)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Inter';
  ctx.fillText(badgeData.name, 550, 250);
  
  // Issuer name
  ctx.font = '32px Inter';
  ctx.fillText(`Issued by ${badgeData.issuer}`, 550, 320);
  
  // Verification badge
  ctx.font = 'bold 24px Inter';
  ctx.fillText('✅ VERIFIED', 550, 400);
  
  return canvas.toBuffer('image/png');
}
```

**Caching Strategy:**
```typescript
// Cache social images in Azure Blob Storage
const socialImageUrl = `https://gcreditdevstoragelz.blob.core.windows.net/badges/social-${badgeId}.png`;

// Generate once, cache forever (badges are immutable)
if (!await blobExists(socialImageUrl)) {
  const socialImage = await generateSocialImage(badgeImageUrl, badge);
  await uploadToBlob(socialImage, socialImageUrl);
}

return socialImageUrl;
```

---

## 🔍 Structured Data (JSON-LD)

### Schema.org Markup

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "{{badgeName}}",
  "description": "{{badgeDescription}}",
  "credentialCategory": "certificate",
  "competencyRequired": "{{criteria}}",
  "recognizedBy": {
    "@type": "Organization",
    "name": "{{issuerName}}",
    "url": "{{issuerWebsite}}"
  },
  "about": [
    {{#each skills}}
    {
      "@type": "DefinedTerm",
      "name": "{{this.name}}",
      "inDefinedTermSet": "Skills"
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ],
  "dateCreated": "{{issuedDate}}",
  "expires": "{{expiresDate}}",
  "credentialId": "{{verificationId}}",
  "url": "https://g-credit.com/verify/{{verificationId}}"
}
</script>
```

**For Revoked Badges:**
```json
{
  "@type": "EducationalOccupationalCredential",
  "name": "{{badgeName}}",
  "credentialStatus": {
    "@type": "CredentialStatus",
    "credentialStatusType": "Revoked",
    "statusReason": "{{revocationReason}}"
  }
}
```

---

## 🧪 Testing & Validation

### 1. Facebook Sharing Debugger

**URL:** https://developers.facebook.com/tools/debug/

**Steps:**
1. Enter verification URL: `https://g-credit.com/verify/abc-123`
2. Click "Debug"
3. Verify all Open Graph tags loaded
4. Check image preview (should show badge image)
5. Click "Scrape Again" to refresh cache

**Common Issues:**

| Issue | Cause | Fix |
|-------|-------|-----|
| Image not showing | Image URL not absolute | Use `https://` full URL |
| Blank preview | Meta tags not in `<head>` | Move tags before `</head>` |
| Cached old data | Facebook cached previous version | Click "Scrape Again" |
| Image too small | Image <200x200px | Use minimum 512x512px |

---

### 2. Twitter Card Validator

**URL:** https://cards-dev.twitter.com/validator

**Steps:**
1. Enter verification URL
2. Click "Preview Card"
3. Verify card type: "summary_large_image"
4. Check image displays correctly
5. Verify title and description

**Expected Output:**
```
Card preview loads successfully
✅ Card type: summary_large_image
✅ Title: Python Programming Expert - Verified Credential
✅ Description: Badge issued by Microsoft Learn...
✅ Image: [Badge image displayed]
```

---

### 3. LinkedIn Post Inspector

**URL:** https://www.linkedin.com/post-inspector/

**Steps:**
1. Enter verification URL
2. Click "Inspect"
3. Verify rich preview displays
4. Check image (1200×630px recommended)

---

### 4. Google Rich Results Test

**URL:** https://search.google.com/test/rich-results

**Steps:**
1. Enter verification URL
2. Wait for analysis
3. Verify structured data detected
4. Check: "EducationalOccupationalCredential" found

**Expected Results:**
```
✅ Page is eligible for rich results
✅ Structured data found: EducationalOccupationalCredential
✅ No errors detected
```

---

## 🚀 Implementation (React + Vite)

### React Helmet for Dynamic Meta Tags

**Install:**
```bash
npm install react-helmet-async
```

**Setup App Provider:**
```tsx
// src/main.tsx
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

**Verification Page Component:**
```tsx
// src/pages/VerifyBadgePage.tsx
import { Helmet } from 'react-helmet-async';

export function VerifyBadgePage() {
  const { verificationId } = useParams();
  const { data: badge } = useQuery(...);
  
  if (!badge) return <NotFound />;
  
  const ogImageUrl = `https://gcreditdevstoragelz.blob.core.windows.net/badges/social-${badge.id}.png`;
  const verificationUrl = `https://g-credit.com/verify/${badge.verificationId}`;
  
  return (
    <>
      <Helmet>
        {/* Basic SEO */}
        <title>{badge.name} - Verified Credential | G-Credit</title>
        <meta name="description" content={badge.description} />
        <link rel="canonical" href={verificationUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${badge.name} - Verified Credential`} />
        <meta property="og:description" content={badge.description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={verificationUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={badge.name} />
        <meta name="twitter:description" content={badge.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalCredential",
            "name": badge.name,
            "description": badge.description,
            "recognizedBy": {
              "@type": "Organization",
              "name": badge.issuer.name
            },
            "dateCreated": badge.issuedAt,
            "url": verificationUrl
          })}
        </script>
      </Helmet>
      
      <div className="verify-page">
        {/* Page content */}
      </div>
    </>
  );
}
```

---

## 📊 Performance Optimization

### Image CDN Configuration

**Azure Blob Storage + CDN:**
```typescript
// Use Azure CDN for faster image delivery
const cdnBaseUrl = 'https://gcredit.azureedge.net';
const imageUrl = `${cdnBaseUrl}/badges/${badgeId}.png`;

// Add cache headers
response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
```

**Image Formats:**
```typescript
// Serve modern formats with fallback
<picture>
  <source srcset="badge.webp" type="image/webp">
  <source srcset="badge.avif" type="image/avif">
  <img src="badge.png" alt="{{badgeName}}">
</picture>
```

---

### Preload Critical Resources

```html
<head>
  <!-- Preload badge image -->
  <link rel="preload" as="image" href="{{badgeImageUrl}}">
  
  <!-- Preload fonts -->
  <link rel="preload" as="font" href="/fonts/inter-var.woff2" crossorigin>
  
  <!-- DNS prefetch for Azure Blob Storage -->
  <link rel="dns-prefetch" href="https://gcreditdevstoragelz.blob.core.windows.net">
</head>
```

---

## ✅ Implementation Checklist

### Setup (Story 6.2)
- [ ] Install react-helmet-async
- [ ] Configure HelmetProvider in main.tsx
- [ ] Create VerificationPageHelmet component
- [ ] Add Open Graph meta tags
- [ ] Add Twitter Card meta tags
- [ ] Add structured data JSON-LD

### Image Generation
- [ ] Create social image generation service
- [ ] Generate 1200×630px images for badges
- [ ] Upload to Azure Blob Storage
- [ ] Configure caching (immutable badges)

### Testing
- [ ] Test on Facebook Sharing Debugger
- [ ] Test on Twitter Card Validator
- [ ] Test on LinkedIn Post Inspector
- [ ] Test Google Rich Results
- [ ] Verify images display correctly
- [ ] Check mobile responsiveness

### Performance
- [ ] Configure Azure CDN (optional)
- [ ] Add cache headers
- [ ] Preload critical resources
- [ ] Test page load speed (<2s target)

---

## 📚 References

- **Open Graph Protocol:** https://ogp.me/
- **Twitter Cards:** https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **Schema.org Credentials:** https://schema.org/EducationalOccupationalCredential
- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
- **Google Rich Results:** https://search.google.com/test/rich-results
- **React Helmet:** https://github.com/staylor/react-helmet-async

---

**Status:** ✅ Ready for Sprint 5 Story 6.2  
**Last Updated:** 2026-01-28  
**Owner:** LegendZhu
