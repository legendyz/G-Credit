# Login Page - UX Design Specification

**Story:** Story 0.2a - Simple Login & Navigation System (MVP)  
**Designer:** Amelia (UX Designer)  
**Date:** February 2, 2026  
**Status:** ✅ Ready for Development

---

## 📐 Wireframe

### Desktop Layout (1280x720)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        [ G-Credit Logo ]                        │
│                                                                 │
│                    Digital Credentialing System                 │
│                                                                 │
│                                                                 │
│                                                                 │
│              ┌───────────────────────────────────┐              │
│              │                                   │              │
│              │          Welcome Back             │              │
│              │                                   │              │
│              │   Email Address                   │              │
│              │   ┌─────────────────────────────┐ │              │
│              │   │ your.email@example.com      │ │              │
│              │   └─────────────────────────────┘ │              │
│              │                                   │              │
│              │   Password                        │              │
│              │   ┌─────────────────────────────┐ │              │
│              │   │ ••••••••••••                │ │              │
│              │   └─────────────────────────────┘ │              │
│              │                                   │              │
│              │   [ ❌ Invalid email or password ]  │  (hidden by default)
│              │                                   │              │
│              │         [ Log In Button ]         │              │
│              │                                   │              │
│              │   Forgot password?                │  (non-functional link)
│              │                                   │              │
│              └───────────────────────────────────┘              │
│                                                                 │
│                                                                 │
│         © 2026 G-Credit. All rights reserved.                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (375x667)

```
┌───────────────────┐
│                   │
│  [ G-Credit ]     │
│                   │
│   Welcome Back    │
│                   │
│   Email           │
│   ┌─────────────┐ │
│   │ email...    │ │
│   └─────────────┘ │
│                   │
│   Password        │
│   ┌─────────────┐ │
│   │ ••••••      │ │
│   └─────────────┘ │
│                   │
│   [ ❌ Error ]     │
│                   │
│   [ Log In ]      │
│                   │
│   Forgot password?│
│                   │
└───────────────────┘
```

---

## 🎨 Visual Design Specifications

### Colors

```css
/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-card: #F9FAFB;
--bg-input: #FFFFFF;
--bg-button: #3B82F6;  /* Blue-500 */
--bg-button-hover: #2563EB;  /* Blue-600 */

/* Text */
--text-primary: #111827;  /* Gray-900 */
--text-secondary: #6B7280;  /* Gray-500 */
--text-error: #DC2626;  /* Red-600 */
--text-link: #3B82F6;  /* Blue-500 */

/* Borders */
--border-input: #D1D5DB;  /* Gray-300 */
--border-input-focus: #3B82F6;  /* Blue-500 */
--border-input-error: #DC2626;  /* Red-600 */
```

### Typography

```css
/* Headings */
h1 (Welcome Back): 
  font-size: 24px; 
  font-weight: 600; 
  color: --text-primary;
  margin-bottom: 32px;

/* Labels */
label: 
  font-size: 14px; 
  font-weight: 500; 
  color: --text-primary;
  margin-bottom: 8px;

/* Inputs */
input: 
  font-size: 16px; 
  font-weight: 400; 
  color: --text-primary;
  padding: 12px 16px;

/* Button */
button: 
  font-size: 16px; 
  font-weight: 500; 
  color: #FFFFFF;
  padding: 12px 24px;

/* Error Message */
.error-message: 
  font-size: 14px; 
  font-weight: 400; 
  color: --text-error;

/* Link */
a (Forgot password): 
  font-size: 14px; 
  font-weight: 400; 
  color: --text-link;
  text-decoration: underline;
```

### Spacing & Layout

```css
/* Container */
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 80px 24px;
}

/* Card */
.login-card {
  background: --bg-card;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Form Elements */
.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
}

input {
  width: 100%;
  border: 1px solid --border-input;
  border-radius: 8px;
}

input:focus {
  outline: none;
  border-color: --border-input-focus;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input.error {
  border-color: --border-input-error;
}

/* Button */
button {
  width: 100%;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background: --bg-button-hover;
}

button:disabled {
  background: #9CA3AF;  /* Gray-400 */
  cursor: not-allowed;
}

/* Error Message */
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #FEE2E2;  /* Red-100 */
  border: 1px solid #FCA5A5;  /* Red-300 */
  border-radius: 8px;
  margin-bottom: 24px;
}

/* Forgot Password Link */
.forgot-password {
  display: block;
  text-align: center;
  margin-top: 16px;
}
```

---

## ♿ Accessibility (ARIA) Specifications

### HTML Structure with ARIA

```html
<main role="main" aria-labelledby="login-title">
  <div class="login-container">
    <div class="login-card">
      <!-- Header -->
      <h1 id="login-title">Welcome Back</h1>

      <!-- Form -->
      <form onSubmit={handleSubmit} noValidate>
        
        <!-- Email Field -->
        <div class="form-group">
          <label 
            htmlFor="email" 
            id="email-label"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={emailError ? "true" : "false"}
            aria-describedby={emailError ? "email-error" : undefined}
            placeholder="your.email@example.com"
          />
          {emailError && (
            <span 
              id="email-error" 
              role="alert" 
              className="error-message"
            >
              {emailError}
            </span>
          )}
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label 
            htmlFor="password" 
            id="password-label"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={passwordError ? "true" : "false"}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
          {passwordError && (
            <span 
              id="password-error" 
              role="alert" 
              className="error-message"
            >
              {passwordError}
            </span>
          )}
        </div>

        <!-- Global Error Alert -->
        {loginError && (
          <div 
            role="alert" 
            aria-live="polite"
            className="error-alert"
          >
            <svg aria-hidden="true" className="error-icon">
              <!-- X icon -->
            </svg>
            <span>{loginError}</span>
          </div>
        )}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading ? "true" : "false"}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        <!-- Forgot Password Link -->
        <a 
          href="#" 
          className="forgot-password"
          onClick={handleForgotPassword}
          aria-label="Request password reset"
        >
          Forgot password?
        </a>
      </form>
    </div>
  </div>
</main>
```

### ARIA Attributes Reference

| Element | ARIA Attribute | Purpose | Value |
|---------|----------------|---------|-------|
| `<main>` | `role="main"` | Landmark for main content | "main" |
| `<main>` | `aria-labelledby` | Connect to page title | "login-title" |
| `<h1>` | `id` | Page title identifier | "login-title" |
| `<input>` | `aria-required` | Mark required fields | "true" |
| `<input>` | `aria-invalid` | Indicate validation error | "true" / "false" |
| `<input>` | `aria-describedby` | Link to error message | Error message ID |
| `<span>` (error) | `role="alert"` | Announce error to SR | "alert" |
| `<div>` (error banner) | `role="alert"` | Announce global error | "alert" |
| `<div>` (error banner) | `aria-live` | Live region for changes | "polite" |
| `<button>` | `aria-busy` | Loading state | "true" / "false" |
| `<svg>` (icon) | `aria-hidden` | Hide decorative icon | "true" |

### Keyboard Navigation

**Tab Order:**
1. Email input
2. Password input
3. Log In button
4. Forgot password link

**Keyboard Shortcuts:**
- `Tab`: Move to next field
- `Shift+Tab`: Move to previous field
- `Enter`: Submit form (when on button or input)
- `Esc`: Clear form errors (optional enhancement)

### Focus States

```css
/* Visible focus indicator (WCAG 2.1 AA requirement) */
input:focus,
button:focus,
a:focus {
  outline: 2px solid #3B82F6;  /* Blue-500 */
  outline-offset: 2px;
}

/* Focus visible only on keyboard navigation */
input:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* No outline on mouse click */
input:focus:not(:focus-visible),
button:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 🔄 Interaction States

### Form States

**1. Default State**
- All fields empty
- No error messages visible
- Log In button enabled
- Forgot password link visible

**2. Filling State**
- User typing in fields
- No validation until submit
- Live validation on blur (optional)

**3. Validation Error State**
- Red border on invalid field
- Error message below field with `role="alert"`
- Field `aria-invalid="true"`
- Focus on first error field

**4. Loading State**
- Button shows "Logging in..."
- Button disabled (`aria-busy="true"`)
- Cursor shows loading spinner

**5. Success State**
- Brief "Success!" message (optional)
- Redirect to dashboard (200ms delay)

**6. Server Error State**
- Red alert banner at top of form
- Error icon + message
- "Invalid email or password" (generic for security)
- Fields remain filled

### Example Error Messages

**Email Validation:**
- Empty: "Email is required"
- Invalid format: "Please enter a valid email address"

**Password Validation:**
- Empty: "Password is required"
- Too short: "Password must be at least 8 characters" (if enforced)

**Login Error:**
- 401: "Invalid email or password"
- 429: "Too many login attempts. Please try again in 5 minutes."
- 500: "Unable to connect to server. Please try again."

---

## 📱 Responsive Breakpoints

```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) {
  .login-container {
    padding: 40px 16px;
  }
  
  .login-card {
    padding: 32px 24px;
  }
  
  h1 {
    font-size: 20px;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .login-container {
    padding: 60px 24px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .login-container {
    padding: 80px 24px;
  }
}
```

---

## 🧪 Testing Checklist

### Manual Testing

**Visual:**
- [ ] Layout matches wireframe
- [ ] Colors match design tokens
- [ ] Typography matches specs
- [ ] Spacing matches specs
- [ ] Logo displays correctly
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1280px)

**Functional:**
- [ ] Form submits on Enter key
- [ ] Error messages appear on invalid input
- [ ] Error messages disappear when corrected
- [ ] Loading state shows during login
- [ ] Success redirect to dashboard
- [ ] Forgot password link shows alert (non-functional)

**Accessibility:**
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus visible on all interactive elements
- [ ] Error messages announced by screen reader
- [ ] Form labels properly associated with inputs
- [ ] ARIA attributes present and correct

### Screen Reader Testing

**NVDA (Windows):**
- [ ] "Main region, Welcome Back, heading level 1"
- [ ] "Email Address, required, edit, blank"
- [ ] "Password, required, edit, password, blank"
- [ ] "Log In, button"
- [ ] On error: "Alert, Invalid email or password"

**VoiceOver (Mac):**
- [ ] Similar announcements as NVDA
- [ ] Error messages interrupt current reading

### Automated Testing

```bash
# Run axe-core accessibility scan
npm run test:a11y

# Expected: 0 violations
```

---

## 🎯 MVP vs Full Features

### Sprint 7 MVP (This Design)

✅ **Included:**
- Basic login form (email + password)
- Form validation
- Error handling
- Loading states
- Basic ARIA labels
- Keyboard navigation
- Focus visible states

⏸️ **Deferred to Sprint 8 (Story 0.2b):**
- Remember me checkbox
- Show/hide password toggle
- Functional forgot password flow
- Social login (Microsoft 365)
- Multi-factor authentication
- Cross-browser testing (Safari, Firefox)
- Full WCAG 2.1 AA compliance (NVDA/VoiceOver testing)

---

## 📚 Design System Tokens

### Tailwind CSS Classes

```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
  <div className="max-w-md w-full space-y-8">
    <div className="bg-white p-10 rounded-xl shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Welcome Back
      </h1>
      
      <form className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition">
          Log In
        </button>
      </form>
    </div>
  </div>
</div>
```

---

## 🔗 References

- **Story:** [0-2-login-navigation.md](0-2-login-navigation.md)
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/patterns/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**UX Designer Sign-Off:** Amelia (UX Designer)  
**Date:** February 2, 2026  
**Status:** ✅ Ready for Development  
**Estimated Implementation Time:** 6 hours (as per Story 0.2a)
