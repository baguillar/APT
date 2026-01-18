// admin/admin_lives.js - Gestión Maestra de Sesiones en Directo
const AdminLives = {
    render: async (container) => {
        UX.showLoader();
        try {
            const lives = await fetch('api/lives.php?action=list').then(r => r.json());
            UX.hideLoader();
            
            container.innerHTML = `
                <div class="dashboard-grid animate-in" style="padding-bottom: 5rem">
                    <!-- CABECERA -->
                    <div style="margin-bottom:3rem">
                        <h2 class="premium-title" style="font-size:2.2rem">Control de Sesiones VIP</h2>
                        <p class="premium-subtitle">Gestiona el calendario de directos y accesos para los martes.</p>
                    </div>

                    <!-- 1. LISTADO DE PROGRAMADAS -->
                    <section class="premium-card" style="padding:2.5rem; margin-bottom:3.5rem">
                        <h3 class="form-section-title" style="margin-bottom:2rem; display:flex; align-items:center; gap:0.8rem">
                            <span style="font-size:1.4rem">📅</span> Sesiones Activas e Historial
                        </h3>
                        <div class="table-responsive" style="overflow-x:auto">
                            <table class="admin-table" style="width:100%; border-collapse:collapse; min-width:700px">
                                <thead>
                                    <tr style="text-align:left; border-bottom:2px solid #f1f5f9; color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:1px">
                                        <th style="padding:1.5rem">Fecha</th>
                                        <th>Sala</th>
                                        <th>Tem&aacute;tica</th>
                                        <th style="text-align:right">Gesti&oacute;n</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lives.length === 0 ? 
                                        '<tr><td colspan="4" style="padding:4rem; text-align:center; opacity:0.4; font-weight:700">No hay sesiones registradas actualmente.</td></tr>' : 
                                        lives.map(l => {
                                            const d = new Date(l.date);
                                            const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---';
                                            return `
                                            <tr style="border-bottom:1px solid #f8fafc">
                                                <td style="padding:1.5rem"><strong>${dateStr}</strong></td>
                                                <td><a href="${l.live_url}" target="_blank" style="color:var(--primary-dark); font-weight:900; font-size:0.8rem; text-decoration:none">Link ↗</a></td>
                                                <td><p style="font-size:0.8rem; opacity:0.6; font-weight:600; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${l.description || '...'}</p></td>
                                                <td style="text-align:right; display:flex; gap:0.6rem; justify-content:flex-end; align-items:center; padding:1.2rem 0">
                                                    <button class="btn btn-outline" style="padding:0.6rem 1rem; font-size:0.7rem; border-radius:1rem" onclick="AdminLives.showEditInline(${l.id}, '${l.date}', '${l.live_url}', '${l.description ? l.description.replace(/'/g, "&apos;") : ""}')">Editar</button>
                                                    <button class="btn" style="padding:0.6rem 1rem; font-size:0.7rem; border-radius:1rem; background:#fee2e2; color:#ef4444; border:none; font-weight:900" onclick="AdminLives.delete(${l.id})">Borrar</button>
                                                </td>
                                            </tr>
                                        `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <!-- 2. PROGRAMACIÓN MÚLTIPLE -->
                    <section id="quick-add-section" class="premium-card" style="padding:3rem; background: #ffffff; border: 3px solid var(--primary-light); box-shadow: 0 10px 30px rgba(0,0,0,0.05)">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem">
                            <div>
                                <h3 style="font-weight:900; font-size:1.4rem">🚀 A&ntilde;adir Nuevas Sesiones</h3>
                                <p style="font-size:0.9rem; opacity:0.6">Programa varios martes de un solo golpe para completar el mes.</p>
                            </div>
                            <button class="btn btn-primary" onclick="AdminLives.addRow()" style="width:50px; height:50px; padding:0; border-radius:50%; font-size:1.8rem; display:flex; align-items:center; justify-content:center; box-shadow: 0 5px 15px rgba(255, 204, 2, 0.4)">+</button>
                        </div>

                        <form id="multi-live-form">
                            <div id="new-sessions-container">
                                <!-- Filas dinámicas se inyectan aquí -->
                            </div>
                            <div id="submit-container" class="hidden" style="margin-top:2.5rem; border-top:2px solid #f1f5f9; padding-top:2rem; text-align:right">
                                <button type="submit" class="btn btn-primary" style="padding:1.2rem 3rem; border-radius:var(--radius-sm); font-size:1rem">Publicar Calendario VIP</button>
                            </div>
                        </form>
                    </section>
                </div>
            `;
        } catch(e) {
            console.error(e);
            container.innerHTML = `<div class="card" style="padding:4rem; text-align:center"><h2 class="premium-title">Error Cr&iacute;tico</h2><p>No se pudo sincronizar el calendario de directos.</p></div>`;
            UX.hideLoader();
        }
    },

    addRow: () => {
        const container = document.getElementById('new-sessions-container');
        const submitBtn = document.getElementById('submit-container');
        submitBtn.classList.remove('hidden');

        const rowId = Date.now();
        const row = document.createElement('div');
        row.className = 'live-row animate-in';
        row.id = `row-${rowId}`;
        row.style = 'display:grid; grid-template-columns: 1fr 1.5fr 1.5fr 50px; gap:1.2rem; margin-bottom:1.2rem; background:#f8fafc; padding:1.5rem; border-radius:1.5rem; align-items:flex-end; border:1px solid #edf2f7';
        
        const d = new Date();
        const count = container.children.length;
        const daysUntilTuesday = (2 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilTuesday + (count * 7));
        const suggestedDate = d.toISOString().split('T')[0];

        row.innerHTML = `
            <div class="input-group" style="margin:0">
                <label style="font-size:0.65rem; margin-bottom:0.4rem; font-weight:900">Fecha</label>
                <input type="date" name="date[]" value="${suggestedDate}" required style="padding:0.9rem; font-size:0.85rem; border-radius:1rem; background:white">
            </div>
            <div class="input-group" style="margin:0">
                <label style="font-size:0.65rem; margin-bottom:0.4rem; font-weight:900">URL Sala VIP</label>
                <input type="url" name="live_url[]" placeholder="https://zoom.us/..." required style="padding:0.9rem; font-size:0.85rem; border-radius:1rem; background:white">
            </div>
            <div class="input-group" style="margin:0">
                <label style="font-size:0.65rem; margin-bottom:0.4rem; font-weight:900">Tem&aacute;tica</label>
                <input type="text" name="description[]" placeholder="Ej: Dudas sobre paseo..." style="padding:0.9rem; font-size:0.85rem; border-radius:1rem; background:white">
            </div>
            <button type="button" class="btn" style="background:#fee2e2; color:#ef4444; border:none; width:45px; height:45px; padding:0; border-radius:50%; font-weight:900; font-size:1.2rem; display:flex; align-items:center; justify-content:center" onclick="AdminLives.removeRow(${rowId})">&times;</button>
        `;
        container.appendChild(row);

        document.getElementById('multi-live-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const dates = formData.getAll('date[]');
            const urls = formData.getAll('live_url[]');
            const descs = formData.getAll('description[]');

            UX.showLoader('Sincronizando directos...');
            try {
                for (let i = 0; i < dates.length; i++) {
                    await fetch('api/lives.php?action=create', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            date: dates[i],
                            live_url: urls[i],
                            description: descs[i]
                        })
                    });
                }
                UX.toast('Calendario de directos actualizado con &eacute;xito');
                await AdminLives.render(document.getElementById('app-view'));
            } catch (err) {
                UX.toast('Error al guardar las sesiones', 'error');
            } finally {
                UX.hideLoader();
            }
        };
    },

    removeRow: (id) => {
        const row = document.getElementById(`row-${id}`);
        if (row) row.remove();
        const container = document.getElementById('new-sessions-container');
        if (container.children.length === 0) {
            document.getElementById('submit-container').classList.add('hidden');
        }
    },

    delete: async (id) => {
        if (!confirm('&iquest;Seguro que quieres eliminar esta sesi&oacute;n?')) return;
        
        UX.showLoader('Eliminando sesi&oacute;n...');
        try {
            const res = await fetch(`api/lives.php?action=delete&id=${id}`).then(r => r.json());
            UX.toast(res.message || 'Sesi&oacute;n eliminada');
            // Refresco inmediato tras borrar
            await AdminLives.render(document.getElementById('app-view'));
        } catch (e) {
            console.error(e);
            UX.toast('Error al eliminar el directo', 'error');
        } finally {
            UX.hideLoader();
        }
    },

    showEditInline: (id, date, url, desc) => {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay animate-in';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:550px; padding:4.5rem; border-radius:var(--radius)">
                <span class="modal-close" onclick="this.parentElement.parentElement.remove()" style="font-size:3rem; top:2rem; right:3rem; cursor:pointer">&times;</span>
                <h2 class="premium-title">Editar Directo</h2>
                <p class="premium-subtitle" style="margin-bottom:3rem">Actualiza los datos de acceso para esta sesi&oacute;n.</p>
                
                <form id="edit-live-form" style="display:flex; flex-direction:column; gap:2.2rem">
                    <div class="input-group">
                        <label>Fecha de la Sesi&oacute;n</label>
                        <input type="date" name="date" value="${date}" required style="border-radius:1.2rem">
                    </div>
                    <div class="input-group">
                        <label>URL de la Sala VIP</label>
                        <input type="url" name="live_url" value="${url}" required style="border-radius:1.2rem" placeholder="https://...">
                    </div>
                    <div class="input-group">
                        <label>Tem&aacute;tica de Dudas</label>
                        <textarea name="description" style="height:110px; border-radius:1.2rem; resize:none" placeholder="Notas sobre el contenido...">${desc}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full" style="height:75px; font-size:1.1rem; margin-top:1rem; border-radius:2rem">ACTUALIZAR DATOS</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('edit-live-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            data.id = id;

            UX.showLoader('Guardando cambios...');
            try {
                await fetch('api/lives.php?action=update', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                }).then(r => r.json());
                
                UX.hideLoader();
                modal.remove();
                UX.toast('Sesi&oacute;n actualizada correctamente');
                await AdminLives.render(document.getElementById('app-view'));
            } catch (err) {
                UX.toast('Error al actualizar la sesi&oacute;n', 'error');
                UX.hideLoader();
            }
        };
    }
};
