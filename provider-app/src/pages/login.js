// Provider App - Premium Agent Login Page
import { API_BASE } from '../config.js';
import { setToken, setAgent } from '../utils/apiFetch.js';

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="login-page">
      <!-- Animated background -->
      <div class="login-grid-overlay"></div>

      <!-- Floating orbs -->
      <div class="login-orb login-orb-1"></div>
      <div class="login-orb login-orb-2"></div>
      <div class="login-orb login-orb-3"></div>

      <!-- Noise texture -->
      <div class="login-noise"></div>

      <!-- Floating particles -->
      <div class="login-particles">
        <div class="login-particle" style="--x:12%;--y:22%;--d:6s;--s:3px"></div>
        <div class="login-particle" style="--x:82%;--y:28%;--d:8s;--s:2px"></div>
        <div class="login-particle" style="--x:38%;--y:72%;--d:7s;--s:4px"></div>
        <div class="login-particle" style="--x:68%;--y:82%;--d:9s;--s:2px"></div>
        <div class="login-particle" style="--x:22%;--y:52%;--d:6.5s;--s:3px"></div>
        <div class="login-particle" style="--x:88%;--y:12%;--d:7.5s;--s:2px"></div>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="login-brand">
          <h1 class="login-brand-name">Electica</h1>
        </div>

        <p class="login-welcome">Sign in to provider portal</p>

        <form id="login-form" class="login-form">
          <div class="login-field">
            <label for="login-agent-id">Agent ID</label>
            <div class="login-input-wrap">
              <span class="material-symbols-outlined login-input-icon">badge</span>
              <input type="text" id="login-agent-id" placeholder="Enter agent ID" autocomplete="username" required />
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

          <button type="submit" id="login-btn" class="login-btn">Sign In</button>
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
    const pw = document.getElementById('login-password');
    const icon = document.querySelector('#login-toggle-pw .material-symbols-outlined');
    if (pw.type === 'password') { pw.type = 'text'; icon.textContent = 'visibility'; }
    else { pw.type = 'password'; icon.textContent = 'visibility_off'; }
  });

  // Handle login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const agentId = document.getElementById('login-agent-id').value.trim().toUpperCase();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const btn = document.getElementById('login-btn');

    if (!agentId || !password) {
      errorText.textContent = 'Please enter Agent ID and password';
      errorEl.style.display = 'flex';
      return;
    }

    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite">progress_activity</span> Signing in...';
    btn.disabled = true;
    errorEl.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/auth/agent/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, password })
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
      setAgent(data.agent);
      onSuccess(data.agent);
    } catch {
      errorText.textContent = 'Cannot connect to server';
      errorEl.style.display = 'flex';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}
