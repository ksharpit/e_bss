// ============================================
// Auth - Phone + OTP + Registration (Demo)
// ============================================
import { showToast } from '../utils/toast.js';
import { API_BASE } from '../config.js';

function normalizePhone(p) { return p.replace(/\D/g, '').slice(-10); }

// onSuccess(userId, name) - verified user logged in
// onPending(userId, name) - pending user logged in or new registration
export function renderAuth(container, onSuccess, onPending) {
  renderPhoneStep(container, onSuccess, onPending);
}

// ── Step 1: Phone Number ──────────────────────────────────
async function renderPhoneStep(container, onSuccess, onPending) {
  let demoUsers = [];
  try {
    demoUsers = await fetch(`${API_BASE}/users?kycStatus=verified&_limit=3`).then(r => r.json());
  } catch { /* show form anyway */ }

  container.innerHTML = `
    <div class="auth-screen">
      <div class="auth-top">
        <div class="auth-top-glow"></div>
        <div class="auth-top-rings"></div>
        <div class="auth-logo-wrap">
          <span class="material-symbols-outlined">bolt</span>
        </div>
        <h1 class="auth-hero-title">Welcome to<br>Electica</h1>
        <p class="auth-hero-sub">Your EV battery swap partner</p>
      </div>

      <div class="auth-card">
        <h2 class="auth-step-title">Enter your mobile</h2>
        <p class="auth-step-sub">We'll verify your Electica account.</p>

        <div class="phone-input-wrap">
          <div class="phone-prefix">🇮🇳 +91</div>
          <input id="auth-phone" class="phone-input" type="tel" inputmode="numeric"
            placeholder="98765 43210" maxlength="10" autocomplete="tel" />
        </div>

        <button class="auth-btn" id="auth-send-otp">
          <span class="material-symbols-outlined">send</span>
          Continue
        </button>

        ${demoUsers.length ? `
        <div class="auth-demo-hint">
          <span class="material-symbols-outlined">info</span>
          <p>
            Demo - existing accounts:<br>
            ${demoUsers.map(u => `<b>${u.phone}</b>`).join(' &nbsp;·&nbsp; ')}
          </p>
        </div>` : ''}

        <p style="text-align:center;font-size:10px;color:var(--text-soft);margin-top:18px;line-height:1.6">
          By continuing you agree to Electica's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  `;

  const phoneInput = document.getElementById('auth-phone');
  const sendBtn    = document.getElementById('auth-send-otp');

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
  });
  phoneInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendBtn.click();
  });

  sendBtn.addEventListener('click', async () => {
    const normalized = normalizePhone(phoneInput.value);
    if (normalized.length !== 10) {
      showToast('Enter a valid 10-digit mobile number', 'error');
      phoneInput.focus();
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Checking...`;

    try {
      const users   = await fetch(`${API_BASE}/users`).then(r => r.json());
      const matched = users.find(u => normalizePhone(u.phone) === normalized);

      if (!matched) {
        // New user - show registration option
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span class="material-symbols-outlined">send</span> Continue`;
        renderNewUserOptions(container, normalized, onSuccess, onPending);
        return;
      }

      if (matched.kycStatus === 'pending') {
        // Pending user - let them in but show pending screen
        showToast('OTP sent - your account is under review', 'info');
        const display = '+91 ' + normalized.slice(0, 5) + '-' + normalized.slice(5);
        renderOtpStep(container, display, matched, onSuccess, onPending);
        return;
      }

      if (matched.kycStatus === 'rejected') {
        showToast('Your KYC was rejected. Please contact support.', 'error');
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span class="material-symbols-outlined">send</span> Continue`;
        return;
      }

      showToast('OTP sent successfully!', 'success');
      const display = '+91 ' + normalized.slice(0, 5) + '-' + normalized.slice(5);
      renderOtpStep(container, display, matched, onSuccess, onPending);

    } catch {
      showToast('Cannot reach server - is json-server running?', 'error');
      sendBtn.disabled = false;
      sendBtn.innerHTML = `<span class="material-symbols-outlined">send</span> Continue`;
    }
  });
}

// ── New User Options (phone not found) ───────────────────
function renderNewUserOptions(container, normalizedPhone, onSuccess, onPending) {
  const display = '+91 ' + normalizedPhone.slice(0, 5) + '-' + normalizedPhone.slice(5);

  // Overlay a card at bottom
  const existing = container.querySelector('.auth-card');
  if (existing) {
    existing.innerHTML = `
      <button class="auth-back-btn" id="nu-back">
        <span class="material-symbols-outlined">arrow_back_ios</span>
        Back
      </button>

      <div style="text-align:center;padding:8px 0 20px">
        <div style="width:64px;height:64px;border-radius:20px;background:var(--gold-light);border:1.5px solid var(--gold-border);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <span class="material-symbols-outlined" style="font-size:30px;color:var(--gold);font-variation-settings:'FILL' 1">person_search</span>
        </div>
        <h2 class="auth-step-title">No account found</h2>
        <p class="auth-step-sub">We couldn't find an Electica account for <b>${display}</b>. Would you like to create one?</p>
      </div>

      <button class="auth-btn" id="nu-register" style="margin-bottom:12px">
        <span class="material-symbols-outlined">person_add</span>
        Create New Account
      </button>

      <button id="nu-retry" style="width:100%;padding:13px;border:1.5px solid var(--border);border-radius:14px;background:var(--surface-2);cursor:pointer;font-family:inherit;font-size:var(--font-sm);font-weight:700;color:var(--text-mid)">
        Try a different number
      </button>

      <div class="auth-demo-hint" style="margin-top:14px">
        <span class="material-symbols-outlined">info</span>
        <p>New accounts require KYC verification and a refundable deposit of <b>INR 3,000</b>. Approval takes 1-2 business days.</p>
      </div>
    `;
    document.getElementById('nu-back')?.addEventListener('click', () => renderPhoneStep(container, onSuccess, onPending));
    document.getElementById('nu-retry')?.addEventListener('click', () => renderPhoneStep(container, onSuccess, onPending));
    document.getElementById('nu-register')?.addEventListener('click', () => renderRegisterStep(container, normalizedPhone, onSuccess, onPending));
  }
}

// ── Step 2: Registration ──────────────────────────────────
function renderRegisterStep(container, normalizedPhone, onSuccess, onPending) {
  const display = '+91 ' + normalizedPhone.slice(0, 5) + '-' + normalizedPhone.slice(5);

  container.innerHTML = `
    <div class="auth-screen" style="background:var(--bg)">
      <div style="background:var(--bg);padding:22px 20px 20px;position:relative;overflow:hidden;border-bottom:1px solid var(--border)">
        <div style="position:absolute;top:-40px;right:-20px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(201,169,110,0.10) 0%,transparent 70%);pointer-events:none"></div>
        <button id="reg-back" style="display:flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;color:var(--text-soft);font-family:inherit;font-size:var(--font-sm);font-weight:700;padding:0 0 14px">
          <span class="material-symbols-outlined" style="font-size:17px">arrow_back_ios</span>
          Back
        </button>
        <h2 style="font-size:1.25rem;font-weight:900;color:var(--text);letter-spacing:-0.04em;margin-bottom:5px">Create Account</h2>
        <p style="font-size:var(--font-xs);color:var(--text-soft);font-weight:600">${display} - Fill in your details</p>
      </div>

      <div class="reg-scroll">
        <div class="reg-field">
          <label class="reg-label">Full Name</label>
          <input id="reg-name" class="reg-input" type="text" placeholder="e.g. Ravi Kumar" autocomplete="name" />
        </div>

        <div class="reg-field">
          <label class="reg-label">Mobile Number</label>
          <input class="reg-input" type="tel" value="${display}" readonly />
        </div>

        <div class="reg-divider">Vehicle Details</div>

        <div class="reg-field">
          <label class="reg-label">Vehicle Model</label>
          <input id="reg-vehicle" class="reg-input" type="text" placeholder="e.g. Ola S1 Pro, Ather 450X" />
        </div>

        <div class="reg-field">
          <label class="reg-label">Vehicle Registration No.</label>
          <input id="reg-vehicleId" class="reg-input" type="text" placeholder="e.g. KA-01-EV-1234" style="text-transform:uppercase" />
        </div>

        <div class="reg-divider">KYC Documents</div>

        <div class="reg-field">
          <label class="reg-label">Aadhaar Number</label>
          <input id="reg-aadhaar" class="reg-input" type="text" inputmode="numeric" placeholder="XXXX XXXX XXXX" maxlength="14" />
        </div>

        <div class="reg-field">
          <label class="reg-label">PAN Card Number</label>
          <input id="reg-pan" class="reg-input" type="text" placeholder="e.g. ABCDE1234F" maxlength="10" style="text-transform:uppercase" />
        </div>

        <div style="padding:12px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);border-radius:12px;margin-bottom:18px;display:flex;align-items:flex-start;gap:8px">
          <span class="material-symbols-outlined" style="font-size:15px;color:var(--amber);flex-shrink:0;margin-top:1px;font-variation-settings:'FILL' 1">info</span>
          <p style="font-size:var(--font-xs);color:var(--amber);font-weight:600;line-height:1.6;opacity:0.85">
            Your provider will verify your documents and collect a refundable security deposit of <b>INR 3,000</b> before activating your account.
          </p>
        </div>

        <button class="auth-btn" id="reg-submit">
          <span class="material-symbols-outlined">send</span>
          Submit Application
        </button>
      </div>
    </div>
  `;

  document.getElementById('reg-back')?.addEventListener('click', () =>
    renderPhoneStep(container, onSuccess, onPending));

  // Aadhaar formatting
  document.getElementById('reg-aadhaar')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 12);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  // PAN uppercase
  document.getElementById('reg-pan')?.addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });
  document.getElementById('reg-vehicleId')?.addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });

  document.getElementById('reg-submit')?.addEventListener('click', async () => {
    const name      = document.getElementById('reg-name')?.value.trim();
    const vehicle   = document.getElementById('reg-vehicle')?.value.trim();
    const vehicleId = document.getElementById('reg-vehicleId')?.value.trim().toUpperCase();
    const aadhaar   = document.getElementById('reg-aadhaar')?.value.replace(/\s/g, '');
    const pan       = document.getElementById('reg-pan')?.value.trim().toUpperCase();

    if (!name || name.split(' ').length < 2) {
      showToast('Please enter your full name (first + last)', 'error');
      return;
    }
    if (!vehicle) { showToast('Please enter your vehicle model', 'error'); return; }
    if (!vehicleId) { showToast('Please enter your vehicle registration no.', 'error'); return; }
    if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
      showToast('Enter a valid 12-digit Aadhaar number', 'error'); return;
    }
    if (pan.length !== 10) { showToast('Enter a valid 10-character PAN number', 'error'); return; }

    const btn = document.getElementById('reg-submit');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Submitting...`;

    try {
      const users = await fetch(`${API_BASE}/users`).then(r => r.json());
      const nextNum = users.length + 1;
      const newId   = 'USR-' + String(nextNum).padStart(4, '0');
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const formattedPhone = '+91 ' + normalizedPhone.slice(0, 5) + '-' + normalizedPhone.slice(5);

      const newUser = {
        id: newId,
        name,
        initials,
        phone: formattedPhone,
        vehicle,
        vehicleId,
        batteryId: null,
        station: null,
        swapCount: 0,
        totalSpent: 0,
        kycStatus: 'pending',
        depositPaid: false,
        depositTxnId: null,
        aadhaar: aadhaar.replace(/(\d{4})/g, '$1-').slice(0, -1),
        pan,
        onboardedBy: null,
        onboardedAt: null,
        lastSwap: null,
        kycSubmittedAt: new Date().toISOString(),
      };

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error('Failed to create account');

      showToast('Application submitted!', 'success');
      setTimeout(() => { if (onPending) onPending(newId, name); }, 900);

    } catch {
      showToast('Could not submit - check your connection', 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Submit Application`;
    }
  });
}

// ── Step 3 (or 2 for pending): OTP Verify ───────────────
function renderOtpStep(container, displayPhone, user, onSuccess, onPending) {
  container.innerHTML = `
    <div class="auth-screen">
      <div class="auth-top">
        <div class="auth-top-glow"></div>
        <div class="auth-top-rings"></div>
        <div class="auth-logo-wrap">
          <span class="material-symbols-outlined">verified_user</span>
        </div>
        <h1 class="auth-hero-title">Verify your<br>number</h1>
        <p class="auth-hero-sub">${displayPhone}</p>
      </div>

      <div class="auth-card">
        <button class="auth-back-btn" id="auth-back">
          <span class="material-symbols-outlined">arrow_back_ios</span>
          Change number
        </button>

        <h2 class="auth-step-title">Enter OTP</h2>
        <p class="auth-step-sub">6-digit code sent to ${displayPhone}</p>

        <div class="otp-boxes">
          ${Array.from({ length: 6 }, (_, i) =>
            `<input class="otp-box" id="otp-${i}" type="tel" inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" />`
          ).join('')}
        </div>

        <button class="auth-btn" id="auth-verify-btn">
          <span class="material-symbols-outlined">lock_open</span>
          Verify OTP
        </button>

        <div class="auth-demo-hint">
          <span class="material-symbols-outlined">info</span>
          <p>Demo mode: enter any 6 digits &nbsp;e.g. <b>1 2 3 4 5 6</b></p>
        </div>

        <div class="resend-row">
          Didn't receive it?
          <span class="resend-link disabled" id="resend-link">Resend in 30s</span>
        </div>
      </div>
    </div>
  `;

  wireOtpBoxes(user, onSuccess, onPending);
  startResendTimer();

  document.getElementById('auth-back')?.addEventListener('click', () => {
    renderPhoneStep(container, onSuccess, onPending);
  });

  document.getElementById('auth-verify-btn')?.addEventListener('click', () => {
    const otp = Array.from({ length: 6 }, (_, i) =>
      document.getElementById(`otp-${i}`)?.value || ''
    ).join('');

    if (otp.length < 6 || !/^\d{6}$/.test(otp)) {
      showToast('Enter the 6-digit OTP', 'error');
      document.getElementById('otp-0')?.focus();
      return;
    }

    const btn = document.getElementById('auth-verify-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> Verifying...`;

    setTimeout(() => {
      if (user.kycStatus === 'pending') {
        showToast(`Welcome, ${user.name.split(' ')[0]}! Your account is under review.`, 'info');
        if (onPending) onPending(user.id, user.name);
      } else {
        showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
        if (onSuccess) onSuccess(user.id, user.name);
      }
    }, 700);
  });
}

// ── Helpers ──────────────────────────────────────────────
function wireOtpBoxes(user, onSuccess, onPending) {
  const boxes = Array.from(document.querySelectorAll('.otp-box'));

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      box.classList.toggle('filled', box.value.length > 0);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      if (boxes.every(b => b.value.length === 1)) {
        setTimeout(() => document.getElementById('auth-verify-btn')?.click(), 280);
      }
    });

    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].value = '';
        boxes[i - 1].classList.remove('filled');
        boxes[i - 1].focus();
      }
    });

    box.addEventListener('paste', e => {
      e.preventDefault();
      const digits = (e.clipboardData || window.clipboardData)
        .getData('text').replace(/\D/g, '').slice(0, 6);
      boxes.forEach((b, idx) => {
        b.value = digits[idx] || '';
        b.classList.toggle('filled', !!digits[idx]);
      });
      boxes[Math.min(digits.length, 5)].focus();
      if (digits.length === 6) setTimeout(() => document.getElementById('auth-verify-btn')?.click(), 280);
    });
  });

  boxes[0]?.focus();
}

function startResendTimer() {
  let sec = 30;
  const update = () => {
    const link = document.getElementById('resend-link');
    if (!link) return;
    sec--;
    if (sec <= 0) {
      link.textContent = 'Resend OTP';
      link.classList.remove('disabled');
      link.addEventListener('click', () => {
        showToast('OTP resent! (Demo: use any 6 digits)', 'info');
        link.classList.add('disabled');
        sec = 30;
        const timer = setInterval(() => {
          const l = document.getElementById('resend-link');
          if (!l) { clearInterval(timer); return; }
          sec--;
          if (sec <= 0) { l.textContent = 'Resend OTP'; l.classList.remove('disabled'); clearInterval(timer); }
          else l.textContent = `Resend in ${sec}s`;
        }, 1000);
      }, { once: true });
    } else {
      link.textContent = `Resend in ${sec}s`;
      setTimeout(update, 1000);
    }
  };
  setTimeout(update, 1000);
}
