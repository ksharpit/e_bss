// ============================================
// Support Page (Electica)
// ============================================
import { icon } from '../components/icons.js';
import { showToast } from '../utils/toast.js';

export function renderSupport(container) {
    container.innerHTML = `
    <div style="max-width:100%;overflow:hidden">
      <div class="page-header">
        <div>
          <h1 class="page-title">Help & Support</h1>
          <p class="page-desc">Get help, report issues, and access documentation</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-bottom:1.25rem">
        ${supportAction('bug_report', 'Report a Bug', 'Found a system issue? Let us know', '#ef4444', '#fef2f2', '#fecaca')}
        ${supportAction('contact_support', 'Contact Support', 'Reach our 24/7 support team', '#D4654A', 'rgba(212,101,74,0.08)', 'rgba(212,101,74,0.25)')}
        ${supportAction('article', 'Documentation', 'Browse API docs and user guides', '#059669', '#ecfdf5', '#a7f3d0')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
        <!-- FAQ -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('help', '20px', 'color:#D4654A')} Frequently Asked Questions
          </h3>
          <div style="display:flex;flex-direction:column;gap:8px" id="faq-list">
            ${faqItem('How do I add a new swap station?', 'Navigate to Dashboard → Click "+ New Station" in the header → Fill in the station details including location, capacity, and pod configuration.')}
            ${faqItem('What does cell imbalance mean?', 'Cell imbalance indicates voltage differences between individual cells in a battery pack. If detected, schedule an inspection via Battery Analytics → Schedule Inspection.')}
            ${faqItem('How to export swap history data?', 'Go to Battery Analytics → Swap History → Click "Export CSV" to download the complete swap log for the selected battery.')}
            ${faqItem('How do I manage station maintenance?', 'Navigate to Station Detail → Click "Maintenance Mode" to take a station offline. Use "Remote Reboot" for quick restart without downtime.')}
            ${faqItem('What are the battery health thresholds?', 'Batteries above 90% SOH are marked green (Optimal). 70-90% is yellow (Warning). Below 70% is red (Critical) and recommended for retirement.')}
          </div>
        </div>

        <!-- Submit Ticket -->
        <div class="card" style="padding:1.5rem">
          <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
            ${icon('confirmation_number', '20px', 'color:#D4654A')} Submit a Ticket
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Subject</label>
              <input type="text" id="ticket-subject" placeholder="Brief description of the issue" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;box-sizing:border-box" />
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Category</label>
              <select id="ticket-category" style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);background:#f8fafc;font-family:inherit;color:#1e293b;box-sizing:border-box">
                <option>Station Issue</option>
                <option>Battery Problem</option>
                <option>Swap Error</option>
                <option>Revenue Discrepancy</option>
                <option>System Bug</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div>
              <label style="font-size:var(--font-xs);font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px">Description</label>
              <textarea id="ticket-description" rows="4" placeholder="Describe the issue in detail..." style="width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:var(--radius-md);font-size:var(--font-md);color:#1e293b;background:#f8fafc;font-family:inherit;resize:vertical;box-sizing:border-box"></textarea>
            </div>
            <button id="submit-ticket-btn" class="btn btn-primary" style="width:fit-content">
              ${icon('send', '16px')} Submit Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- System Status -->
      <div class="card" style="padding:1.5rem;margin-bottom:1.25rem">
        <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;margin-bottom:1.25rem">
          ${icon('monitoring', '20px', 'color:#D4654A')} System Status
        </h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
          ${statusItem('API Gateway', 'Operational', 'success')}
          ${statusItem('Database', 'Operational', 'success')}
          ${statusItem('IoT Bridge', 'Degraded', 'warning')}
          ${statusItem('Analytics Engine', 'Operational', 'success')}
        </div>
      </div>

      <footer class="app-footer" style="margin-top:2rem">
        ${icon('bolt', '16px', 'vertical-align:middle;margin-right:6px;color:#9ca3af')}
        Electica Enterprise Dashboard © 2024
      </footer>
    </div>
  `;

    // FAQ accordion
    container.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const answer = item.querySelector('.faq-answer');
            const chevron = item.querySelector('.faq-chevron');
            const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '';
            // Close all
            container.querySelectorAll('.faq-answer').forEach(a => { a.style.maxHeight = '0px'; a.style.padding = '0 12px'; });
            container.querySelectorAll('.faq-chevron').forEach(c => c.style.transform = 'rotate(0deg)');
            if (!isOpen) {
                answer.style.maxHeight = '200px';
                answer.style.padding = '8px 12px 12px';
                chevron.style.transform = 'rotate(180deg)';
            }
        });
    });

    // Submit ticket
    document.getElementById('submit-ticket-btn')?.addEventListener('click', () => {
        const subject = document.getElementById('ticket-subject')?.value;
        if (!subject?.trim()) {
            showToast('Please enter a subject for your ticket', 'warning');
            return;
        }
        showToast('Ticket submitted successfully! ID: #TKT-' + Math.floor(Math.random() * 9000 + 1000), 'success');
        document.getElementById('ticket-subject').value = '';
        document.getElementById('ticket-description').value = '';
    });

    // Support action cards
    container.querySelectorAll('.support-action-card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;
            if (action === 'bug') showToast('Bug report form opened - redirecting...', 'info');
            else if (action === 'contact') showToast('Support team contacted - response within 15 min', 'success');
            else if (action === 'docs') showToast('Documentation portal opening...', 'info');
        });
    });
}

function supportAction(iconName, title, desc, color, bg, border) {
    const action = iconName === 'bug_report' ? 'bug' : iconName === 'contact_support' ? 'contact' : 'docs';
    return `
    <div class="card support-action-card" data-action="${action}" style="padding:1.5rem;cursor:pointer;transition:all 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
      <div style="width:44px;height:44px;border-radius:12px;background:${bg};border:1px solid ${border};display:flex;align-items:center;justify-content:center;margin-bottom:1rem">
        <span class="material-symbols-outlined" style="font-size:22px;color:${color}">${iconName}</span>
      </div>
      <h3 style="font-size:var(--font-lg);font-weight:700;color:#1e293b;margin-bottom:4px">${title}</h3>
      <p style="font-size:var(--font-sm);color:#64748b">${desc}</p>
    </div>
  `;
}

function faqItem(question, answer) {
    return `
    <div class="faq-item" style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
      <div class="faq-question" style="padding:12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:600;font-size:var(--font-md);color:#1e293b;transition:background 0.15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        ${question}
        <span class="material-symbols-outlined faq-chevron" style="font-size:18px;color:#94a3b8;transition:transform 0.2s">expand_more</span>
      </div>
      <div class="faq-answer" style="max-height:0px;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;padding:0 12px;font-size:var(--font-sm);color:#64748b;line-height:1.5">${answer}</div>
    </div>
  `;
}

function statusItem(name, status, type) {
    const colors = {
        success: { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
        warning: { bg: '#fefce8', color: '#a16207', dot: '#f59e0b' },
        error: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
    };
    const c = colors[type];
    return `
    <div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:600;color:#1e293b;font-size:var(--font-md)">${name}</span>
      <span style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--radius-full);font-size:var(--font-xs);font-weight:700;background:${c.bg};color:${c.color}">
        <span style="width:6px;height:6px;border-radius:50%;background:${c.dot}"></span> ${status}
      </span>
    </div>
  `;
}
