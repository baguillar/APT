// admin/admin_health.js - v20.7 Clean Text
const AdminHealth = {
    render: async (container) => {
        UX.showLoader();
        try {
            const res = await fetch('api/admin_health.php?action=list_pending').then(r => r.json());
            UX.hideLoader();
            
            container.innerHTML = `
                <div class="animate-in">
                    <div style="margin-bottom:3rem">
                        <h2 class="premium-title">Revisiones de Salud</h2>
                        <p class="premium-subtitle">Valida las propuestas de evolucion de los alumnos.</p>
                    </div>

                    <div class="requests-list">
                        ${res.length === 0 ? `
                            <div class="card" style="text-align:center; padding:4rem; opacity:0.5">
                                <p>No hay solicitudes pendientes en este momento.</p>
                            </div>
                        ` : res.map(r => `
                            <div class="card" style="margin-bottom:2rem; padding:2rem">
                                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; border-bottom:1px solid #f1f5f9; padding-bottom:1rem">
                                    <div>
                                        <h3 style="font-weight:900">${r.dogName || '...'}</h3>
                                        <small style="opacity:0.6">${r.ownerName || 'Dueno'} (${r.user_email})</small>
                                    </div>
                                    <span class="badge" style="background:var(--bg)">Recibida: ${new Date(r.created_at).toLocaleDateString()}</span>
                                </div>

                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem">
                                    <div style="background:#f8fafc; padding:1.5rem; border-radius:1rem">
                                        <h4 style="font-size:0.7rem; text-transform:uppercase; margin-bottom:1rem; font-weight:900">Niveles Propuestos</h4>
                                        <div style="display:flex; flex-direction:column; gap:0.5rem">
                                            <p>Fisica: <strong>${r.p_physical}/10</strong></p>
                                            <p>Cognitiva: <strong>${r.p_cognitive}/10</strong></p>
                                            <p>Social: <strong>${r.p_social}/10</strong></p>
                                            <p>Emocional: <strong>${r.p_emotional}/10</strong></p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style="font-size:0.7rem; text-transform:uppercase; margin-bottom:1rem; font-weight:900">Comentario del Cliente</h4>
                                        <p style="font-style:italic; font-size:0.9rem; line-height:1.6">"${r.user_comment || 'Sin comentarios'}"</p>
                                    </div>
                                </div>

                                <div style="margin-top:2rem; padding-top:2rem; border-top:1px solid #f1f5f9">
                                    <h4 style="font-size:0.7rem; text-transform:uppercase; margin-bottom:1rem; font-weight:900">Tu veredicto</h4>
                                    <textarea id="admin-comment-${r.id}" placeholder="Escribe el feedback que recibira el cliente..." style="height:100px; margin-bottom:1.5rem"></textarea>
                                    <div style="display:flex; gap:1rem">
                                        <button class="btn btn-primary" onclick="AdminHealth.validate(${r.id}, 'approved')" style="flex:2; background:#10b981; color:white">APROBAR EVOLUCION</button>
                                        <button class="btn" style="background:#fee2e2; color:#b91c1c; border:none; flex:1" onclick="AdminHealth.validate(${r.id}, 'rejected')">RECHAZAR</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch(e) { 
            console.error(e);
            UX.hideLoader(); 
            UX.toast('Error cargando bandeja de salud', 'error'); 
        }
    },

    validate: async (id, status) => {
        const commentArea = document.getElementById(`admin-comment-${id}`);
        const comment = commentArea.value.trim();
        if (!comment) {
            UX.toast('Escribe un comentario antes de decidir.', 'error');
            commentArea.focus();
            return;
        }

        UX.showLoader('Sincronizando...');
        try {
            const response = await fetch('api/users.php?action=validate_health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: id, status: status, admin_comment: comment })
            });

            const res = await response.json();
            if (response.ok && res.success) {
                UX.toast('Salud actualizada');
                AdminHealth.render(document.getElementById('app-view'));
            } else {
                throw new Error(res.detail || res.error || 'Fallo en la validacion');
            }
        } catch (e) {
            console.error(e);
            UX.toast('Error: ' + e.message, 'error');
        } finally {
            UX.hideLoader();
        }
    }
};