// admin/admin_feedback.js - v20.0 Pro Interface
const AdminFeedback = {
    render: async (container) => {
        UX.showLoader();
        try {
            const pending = await fetch('api/feedback.php?action=get_pending').then(r => r.json());
            UX.hideLoader();
            
            container.innerHTML = `
                <div class="animate-in" style="max-width:900px; margin:0 auto">
                    <div style="margin-bottom:3rem">
                        <h2 class="premium-title">Bandeja de Consultas</h2>
                        <p class="premium-subtitle">Gestiona las dudas de los alumnos con contexto total del ejercicio.</p>
                    </div>

                    <div class="feedback-list">
                        ${pending.length === 0 ? `
                            <div class="card" style="text-align:center; padding:5rem; opacity:0.4; border: 2px dashed #eee">
                                <p style="font-weight:800; font-size:1.1rem">\u00a1Todo el club est\u00e1 al d\u00eda! No hay dudas pendientes.</p>
                            </div>
                        ` : pending.map(f => `
                            <div class="doubt-item ${f.subscription === 'premium' ? 'premium' : ''}" style="box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; background:white; padding:2rem; border-radius:1.5rem; margin-bottom:2rem">
                                <div style="display:flex; justify-content:space-between; margin-bottom:1.2rem; align-items:center">
                                    <div style="display:flex; align-items:center; gap:0.8rem">
                                        <span class="badge ${f.subscription === 'premium' ? 'badge-premium' : ''}" style="background:#f1f5f9; color:var(--text-muted)">
                                            ${f.subscription.toUpperCase()}
                                        </span>
                                        <span style="font-size:0.8rem; font-weight:800; color:var(--text-muted)">${f.dogName}</span>
                                    </div>
                                    <small style="opacity:0.4; font-size:0.7rem; font-weight:800">${new Date(f.created_at).toLocaleString('es-ES')}</small>
                                </div>

                                <div style="margin-bottom:1.5rem">
                                    <div style="background:var(--primary-light); color:var(--primary-dark); padding:0.5rem 1rem; border-radius:0.5rem; display:inline-block; font-size:0.65rem; font-weight:900; margin-bottom:1rem; text-transform:uppercase">
                                        \ud83d\udc36 Ejercicio: ${f.exercise_name || 'Consulta Directa'}
                                    </div>
                                    <p style="font-size:1.1rem; line-height:1.6; color:#444; background:#fcfcfc; padding:1.5rem; border-radius:1rem; border:1px solid #f8fafc">
                                        "${f.message}"
                                    </p>
                                </div>

                                <div style="display:flex; flex-direction:column; gap:1rem">
                                    <textarea id="resp-${f.id}" placeholder="Escribe tu respuesta VIP aqu\u00ed..." style="height:100px; background:#fffdf5; border:1px solid var(--primary-light); font-size:0.95rem"></textarea>
                                    <div style="display:flex; justify-content:space-between; align-items:center">
                                        <button class="btn btn-outline" style="font-size:0.7rem" onclick="Admin.showFullProfile('${f.user_email}')">VER EXPEDIENTE</button>
                                        <button class="btn btn-primary" style="padding:0.8rem 2.5rem" onclick="AdminFeedback.respond(${f.id})">RESPONDER AL CLIENTE</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (e) {
            UX.hideLoader();
            UX.toast('Error al cargar la bandeja', 'error');
        }
    },

    respond: async (id) => {
        const text = document.getElementById(`resp-${id}`).value;
        if (!text) return UX.toast('Escribe una respuesta', 'error');
        
        UX.showLoader('Enviando...');
        try {
            await fetch('api/feedback.php?action=respond', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ feedback_id: id, response: text })
            });
            UX.hideLoader();
            UX.toast('Respuesta enviada con \u00e9xito');
            AdminFeedback.render(document.getElementById('app-view'));
        } catch (e) {
            UX.hideLoader();
            UX.toast('Error al enviar respuesta', 'error');
        }
    }
};