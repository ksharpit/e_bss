// Provider App - Agent Login Page
import { API_BASE } from '../config.js';
import { setToken, setAgent } from '../utils/apiFetch.js';

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="login-brand-icon">
            <span class="material-symbols-outlined" style="font-size:28px;color:var(--coral);font-variation-settings:'FILL' 1">bolt</span>
          </div>
          <h1 class="login-title">Electica</h1>
          <p class="login-subtitle">Provider App</p>
        </div>

        <form id="login-form" class="login-form">
          <div class="login-field">
            <label>Agent ID</label>
            <input type="text" id="login-agent-id" placeholder="e.g. AGT-001" autocomplete="username" required />
          </div>
          <div class="login-field">
            <label>Password</label>
            <div class="login-password-wrap">
              <input type="password" id="login-password" placeholder="Enter password" autocomplete="current-password" required />
              <button type="button" id="login-toggle-pw" class="login-toggle-pw" tabindex="-1">
                <span class="material-symbols-outlined" style="font-size:18px">visibility_off</span>
              </button>
            </div>
          </div>
          <div id="login-error" class="login-error" style="display:none"></div>
          <button type="submit" id="login-btn" class="login-btn">Sign In</button>
        </form>

        <p class="login-hint">Default: AGT-001 / agent123</p>
      </div>
    </div>
  `;

  document.getElementById('login-toggle-pw')?.addEventListener('click', () => {
    const pw = document.getElementById('login-password');
    const icon = document.querySelector('#login-toggle-pw .material-symbols-outlined');
    if (pw.type === 'password') { pw.type = 'text'; icon.textContent = 'visibility'; }
    else { pw.type = 'password'; icon.textContent = 'visibility_off'; }
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const agentId = document.getElementById('login-agent-id').value.trim().toUpperCase();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    if (!agentId || !password) {
      errorEl.textContent = 'Please enter Agent ID and password';
      errorEl.style.display = 'block';
      return;
    }

    btn.textContent = 'Signing in...';
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
        errorEl.textContent = data.error || 'Login failed';
        errorEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
        return;
      }

      setToken(data.token);
      setAgent(data.agent);
      onSuccess(data.agent);
    } catch {
      errorEl.textContent = 'Cannot connect to server. Is the API running?';
      errorEl.style.display = 'block';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}
