// Admin Dashboard - Premium Login Page
import { API_BASE } from '../config.js';
import { setToken, setAdminUser } from '../utils/apiFetch.js';

export function renderLogin(onSuccess) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <!-- Animated background -->
      <div class="login-aurora">
        <div class="login-aurora-beam login-aurora-beam-1"></div>
        <div class="login-aurora-beam login-aurora-beam-2"></div>
        <div class="login-aurora-beam login-aurora-beam-3"></div>
      </div>
      <div class="login-noise"></div>

      <!-- Floating particles -->
      <div class="login-particles">
        <div class="login-particle" style="--x:15%;--y:20%;--d:6s;--s:3px"></div>
        <div class="login-particle" style="--x:80%;--y:30%;--d:8s;--s:2px"></div>
        <div class="login-particle" style="--x:40%;--y:70%;--d:7s;--s:4px"></div>
        <div class="login-particle" style="--x:70%;--y:80%;--d:9s;--s:2px"></div>
        <div class="login-particle" style="--x:25%;--y:55%;--d:6.5s;--s:3px"></div>
        <div class="login-particle" style="--x:90%;--y:15%;--d:7.5s;--s:2px"></div>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <!-- Brand -->
        <div class="login-brand">
          <h1 class="login-brand-name">Electica</h1>
        </div>

        <p class="login-welcome">Sign in to admin dashboard</p>

        <!-- Form -->
        <form id="login-form" class="login-form">
          <div class="login-field">
            <label for="login-username">Username</label>
            <div class="login-input-wrap">
              <span class="material-symbols-outlined login-input-icon">person</span>
              <input type="text" id="login-username" placeholder="Enter username" autocomplete="username" required />
            </div>
          </div>

          <div class="login-field">
            <label for="login-password">Password</label>
            <div class="login-input-wrap">
              <span class="material-symbols-outlined login-input-icon">lock</span>
              <input type="password" id="login-password" placeholder="Enter password" autocomplete="current-password" required />
              <button type="button" id="login-toggle-pw" class="login-toggle-pw" tabindex="-1">
                <span class="material-symbols-outlined" style="font-size:18px">visibility_off</span>
              </button>
            </div>
          </div>

          <div id="login-error" class="login-error" style="display:none">
            <span class="material-symbols-outlined" style="font-size:15px">error</span>
            <span id="login-error-text"></span>
          </div>

          <button type="submit" id="login-btn" class="login-btn">
            Sign In
          </button>
        </form>

        <div class="login-secured">
          <span class="material-symbols-outlined" style="font-size:12px;font-variation-settings:'FILL' 1">lock</span>
          Secured with JWT
        </div>
      </div>
    </div>
  `;

  // Toggle password visibility
  document.getElementById('login-toggle-pw')?.addEventListener('click', () => {
    const pwInput = document.getElementById('login-password');
    const icon = document.querySelector('#login-toggle-pw .material-symbols-outlined');
    if (pwInput.type === 'password') {
      pwInput.type = 'text';
      icon.textContent = 'visibility';
    } else {
      pwInput.type = 'password';
      icon.textContent = 'visibility_off';
    }
  });

  // Handle login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const btn = document.getElementById('login-btn');

    if (!username || !password) {
      errorText.textContent = 'Please enter username and password';
      errorEl.style.display = 'flex';
      return;
    }

    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite">progress_activity</span> Signing in...';
    btn.disabled = true;
    errorEl.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorText.textContent = data.error || 'Invalid credentials';
        errorEl.style.display = 'flex';
        btn.textContent = 'Sign In';
        btn.disabled = false;
        return;
      }

      setToken(data.token);
      setAdminUser(data.user);
      onSuccess();
    } catch {
      errorText.textContent = 'Cannot connect to server';
      errorEl.style.display = 'flex';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}
