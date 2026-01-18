// admin/admin.js - v20.0 Admin Master
const Admin = {
    renderDashboard: async function(container) {
        UX.showLoader();
        try {
            const [alerts, clients] = await Promise.all([
                fetch('api/admin_dashboard.php?action=get_alerts').then(r => r.json()),
                fetch('api/admin_users.php?action=list_segmented').then(r => r.json())
            ]);
            UX.hideLoader();

            container.innerHTML = `
                <div class="animate-in">
                    <h2 class="premium-title" style="margin-bottom:2.5rem">Panel Maestro</h2>
                    <div class="admin-stats-grid" style="margin-bottom:3rem">
                        <div class="stat-card" onclick="location.hash='#/admin-feedback'"><h4>Consultas</h4><p>${alerts.dudas.length}</p></div>
                        <div class="stat-card" onclick="location.hash='#/admin-users'"><h4>Planificar</h4><p>${clients.pending.length}</p></div>
                        <div class="stat-card" onclick="location.hash='#/admin-health'"><h4>Salud</h4><p>${alerts.health_requests.length}</p></div>
                    </div>
                    <div class="card">
                        <h3 style="margin-bottom:2rem">Nuevos Alumnos</h3>
                        ${alerts.new_users.map(u => `
                            <div style="padding:1rem; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center">
                                <div><strong>${u.dogName || '...'}</strong><br><small>${u.email}</small></div>
                                <button class="btn btn-primary" style="font-size:0.7rem" onclick="Admin.showFullProfile('${u.email}')">GESTIONAR</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch(e) { UX.hideLoader(); }
    },

    renderUsers: async function(container) {
        UX.showLoader();
        const data = await fetch('api/admin_users.php?action=list_segmented').then(r => r.json());
        UX.hideLoader();
        
        container.innerHTML = `
            <div class="animate-in">
                <h2 class="premium-title" style="margin-bottom:2rem">Gestión de Alumnos</h2>
                <div class="admin-user-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:1.5rem">
                    ${this.renderUserCards([...data.pending, ...data.planned])}
                </div>
            </div>
        `;
    },

    renderUserCards: function(list) {
        if (list.length === 0) return '<p style="opacity:0.3; padding:2rem">No hay alumnos.</p>';
        return list.map(u => `
            <div class="card" style="padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; border:1px solid #eee">
                <div style="margin-bottom:1.5rem">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
                        <h4 style="font-weight:900; font-size:1.1rem">${u.dogName || 'Sin Nombre'}</h4>
                        <span class="badge ${u.subscription === 'premium' ? 'badge-premium' : ''}" style="font-size:0.6rem">
                            ${u.subscription.toUpperCase()}
                        </span>
                    </div>
                    <p style="font-size:0.75rem; opacity:0.6">${u.email}</p>
                </div>
                <button class="btn btn-primary btn-full" style="font-size:0.75rem; padding:0.8rem" onclick="Admin.showFullProfile('${u.email}')">ABRIR EXPEDIENTE</button>
            </div>
        `).join('');
    },

    showFullProfile: async function(email) {
        UX.showLoader();
        const res = await fetch(`api/admin_users.php?action=get_full_profile&email=${email}`).then(r => r.json());
        const u = res.user;
        const doubts = res.doubts || [];
        UX.hideLoader();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay animate-in';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:95vw; width:1400px; padding:0; height:90vh; display:flex; flex-direction:column">
                <div style="background:var(--text); padding:1.5rem 3rem; color:white; display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <h2 style="font-weight:900; color:var(--primary); font-size:1.5rem">${u.dogName.toUpperCase()}</h2>
                        <p style="opacity:0.7; font-size:0.75rem">${u.ownerName || 'Dueño'} | Plan ${u.subscription.toUpperCase()}</p>
                    </div>
                    <button class="btn" style="background:rgba(255,255,255,0.1); color:white; border:none; padding:0.5rem 1rem" onclick="this.closest('.modal-overlay').remove()">X CERRAR</button>
                </div>
                <div style="display:flex; border-bottom:1px solid #eee; background:#f8fafc">
                    <button class="tab-btn active" onclick="Admin.switchTab(this, 'tab-plan', '${email}')">1. PLANIFICACIÓN</button>
                    <button class="tab-btn" onclick="Admin.switchTab(this, 'tab-health', '${email}')">2. SALUD VITAL</button>
                    <button class="tab-btn" onclick="Admin.switchTab(this, 'tab-feedback', '${email}')">3. CONSULTAS (${doubts.length})</button>
                    <button class="tab-btn" onclick="Admin.switchTab(this, 'tab-notes', '${email}')">4. NOTAS</button>
                </div>
                <div id="modal-tab-content" style="flex:1; overflow-y:auto; padding:2rem; background:white">
                    <div id="tab-plan" class="tab-pane active"><div id="admin-user-calendar-container"></div></div>
                    <div id="tab-health" class="tab-pane"></div>
                    <div id="tab-feedback" class="tab-pane">
                        <div style="max-width:800px; margin:0 auto">
                            <h3 style="margin-bottom:1.5rem; font-weight:900">Historial de Consultas</h3>
                            ${doubts.length === 0 ? '<p style="opacity:0.4; text-align:center; padding:4rem">No hay consultas registradas.</p>' : doubts.map(d => `
                                <div style="margin-bottom:1.5rem; padding:1.5rem; border-radius:1rem; background:#f8fafc; border:1px solid #eee">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:0.8rem">
                                        <strong style="color:var(--primary-dark); font-size:0.7rem; text-transform:uppercase">${d.exercise_name || 'Consulta General'}</strong>
                                        <small style="opacity:0.5">${new Date(d.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <p style="font-size:0.95rem; margin-bottom:1rem">"${d.message}"</p>
                                    ${d.admin_response ? `
                                        <div style="background:white; padding:1rem; border-radius:0.8rem; border-left:3px solid var(--primary)">
                                            <p style="font-size:0.85rem"><strong>Respuesta:</strong> ${d.admin_response}</p>
                                        </div>
                                    ` : '<p style="font-size:0.75rem; color:#ef4444; font-weight:900">PENDIENTE DE RESPUESTA</p>'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div id="tab-notes" class="tab-pane">
                        <textarea id="trainer-notes" style="height:350px; margin-bottom:1rem">${u.trainer_notes || ''}</textarea>
                        <button class="btn btn-primary btn-full" onclick="Admin.saveNotes('${u.email}')">GUARDAR SEGUIMIENTO</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        Admin.switchTab(modal.querySelector('.tab-btn.active'), 'tab-plan', email);
    },

    switchTab: async function(btn, tabId, email) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(tabId);
        pane.classList.add('active');

        if (tabId === 'tab-plan') {
            const today = new Date();
            const monday = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)));
            AdminCalendar.renderUserWeek(document.getElementById('admin-user-calendar-container'), email, monday);
        } else if (tabId === 'tab-health') {
            pane.innerHTML = `<div style="text-align:center; padding:5rem">Cargando semáforo...</div>`;
            const hData = await fetch(`api/users.php?action=get_health&email=${email}`).then(r => r.json());
            const cur = hData.current || {physical:5, cognitive:5, social:5, emotional:5};
            pane.innerHTML = `
                <div style="max-width:800px; margin:0 auto">
                    <div class="card" style="margin-bottom:2rem">
                        <h3 style="margin-bottom:2rem; font-weight:900">Actualizar Estado de Salud</h3>
                        <form id="admin-health-form">
                            <input type="hidden" name="email" value="${email}">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem">
                                <div><label>Física: <span id="val-p">${cur.physical}</span></label><input type="range" name="physical" min="0" max="10" value="${cur.physical}" oninput="document.getElementById('val-p').innerText=this.value"></div>
                                <div><label>Cognitiva: <span id="val-c">${cur.cognitive}</span></label><input type="range" name="cognitive" min="0" max="10" value="${cur.cognitive}" oninput="document.getElementById('val-c').innerText=this.value"></div>
                                <div><label>Social: <span id="val-s">${cur.social}</span></label><input type="range" name="social" min="0" max="10" value="${cur.social}" oninput="document.getElementById('val-s').innerText=this.value"></div>
                                <div><label>Emocional: <span id="val-e">${cur.emotional}</span></label><input type="range" name="emotional" min="0" max="10" value="${cur.emotional}" oninput="document.getElementById('val-e').innerText=this.value"></div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-full" style="margin-top:2rem">GUARDAR NUEVO ESTADO</button>
                        </form>
                    </div>
                </div>`;
            
            document.getElementById('admin-health-form').onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target));
                UX.showLoader('Sincronizando...');
                await fetch('api/users.php?action=admin_update_health', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
                });
                UX.hideLoader();
                UX.toast('Salud actualizada');
            };
        }
    },

    saveNotes: async function(email) {
        const notes = document.getElementById('trainer-notes').value;
        UX.showLoader('Guardando...');
        await fetch('api/admin_users.php?action=update_trainer_notes', {
            method: 'POST', body: JSON.stringify({ email, notes })
        });
        UX.hideLoader();
        UX.toast('Notas actualizadas');
    }
};