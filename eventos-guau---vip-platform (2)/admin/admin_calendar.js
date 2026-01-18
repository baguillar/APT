// admin/admin_calendar.js - v14.0 Vision
const AdminCalendar = {
    currentViewDate: null,

    renderUserWeek: async (container, userEmail, startOfWeek) => {
        AdminCalendar.currentViewDate = new Date(startOfWeek);
        const startStr = startOfWeek.toISOString().split('T')[0];
        
        container.innerHTML = `<div style="padding:4rem; text-align:center; opacity:0.5">Cargando semana...</div>`;
        const assigned = await fetch(`api/assignments.php?action=get_week&start=${startStr}&user=${userEmail}`).then(r => r.json());
        
        container.innerHTML = `
            <div style="background:white; border-radius:1rem">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; background:#f1f5f9; padding:1.5rem; border-radius:1.2rem">
                    <h3 style="font-weight:900; font-size:1.1rem">Semana del ${startOfWeek.toLocaleDateString('es-ES', {day:'numeric', month:'long'})}</h3>
                    <div style="display:flex; gap:0.5rem">
                        <button class="btn btn-outline" style="padding:0.6rem 1.2rem; font-size:0.75rem" onclick="AdminCalendar.shiftWeek('${userEmail}', -7)">« Anterior</button>
                        <button class="btn btn-outline" style="padding:0.6rem 1.2rem; font-size:0.75rem" onclick="AdminCalendar.shiftWeek('${userEmail}', 7)">Siguiente »</button>
                    </div>
                </div>
                
                <div style="overflow-x: auto; padding-bottom:1.5rem; scrollbar-width: thin">
                    <div style="display:grid; grid-template-columns: repeat(7, minmax(170px, 1fr)); gap:1rem; min-width:1200px">
                        ${[0,1,2,3,4,5,6].map(i => {
                            const day = new Date(startOfWeek);
                            day.setDate(day.getDate() + i);
                            const dayStr = day.toISOString().split('T')[0];
                            const dayAssignments = assigned.filter(a => a.date === dayStr);
                            
                            return `
                                <div style="background:#fcfcfc; border:1px solid #edf2f7; padding:1.2rem; border-radius:1.5rem; min-height:400px; display:flex; flex-direction:column">
                                    <div style="border-bottom:2px solid #f1f5f9; padding-bottom:0.8rem; margin-bottom:1rem; text-align:center">
                                        <strong style="font-size:0.65rem; text-transform:uppercase; color:var(--text-muted)">${day.toLocaleDateString('es-ES', {weekday: 'long'})}</strong><br>
                                        <span style="font-weight:900; font-size:1.4rem; color:var(--text)">${day.getDate()}</span>
                                    </div>

                                    <div style="flex:1; display:flex; flex-direction:column; gap:0.6rem">
                                        ${dayAssignments.map(a => `
                                            <div class="ex-pill" style="font-size:0.65rem; padding:0.8rem; position:relative; background:white; border:1px solid #eee; border-left:4px solid var(--primary)">
                                                <strong style="display:block; margin-bottom:0.2rem">${a.name}</strong>
                                                <small style="opacity:0.6">${a.custom_duration || a.duration} min</small>
                                                <button onclick="AdminCalendar.deleteAssignment(${a.id}, '${userEmail}', '${dayStr}')" style="position:absolute; top:5px; right:5px; border:none; background:none; color:#ef4444; font-size:1rem; cursor:pointer; font-weight:900">&times;</button>
                                            </div>
                                        `).join('')}
                                    </div>

                                    <button class="btn btn-primary" style="padding:0.7rem; font-size:0.65rem; width:100%; margin-top:1.2rem; background:var(--primary); border-radius:0.8rem" onclick="AdminCalendar.showAssignModal('${userEmail}', '${dayStr}')">+ ASIGNAR</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    shiftWeek: function(email, diff) {
        const newDate = new Date(AdminCalendar.currentViewDate);
        newDate.setDate(newDate.getDate() + diff);
        AdminCalendar.renderUserWeek(document.getElementById('admin-user-calendar-container'), email, newDate);
    },

    showAssignModal: async (email, date) => {
        const exercises = await fetch('api/exercises.php?action=list').then(r => r.json());
        const modal = document.createElement('div');
        modal.className = 'modal-overlay animate-in';
        modal.style.zIndex = "11000";
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px; padding:3rem">
                <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</span>
                <h2 style="font-weight:900; margin-bottom:0.5rem">Asignar Ejercicio</h2>
                <p style="margin-bottom:2rem; opacity:0.6; font-size:0.9rem">Día: ${new Date(date).toLocaleDateString()}</p>
                <form id="assign-form" style="display:flex; flex-direction:column; gap:1.2rem">
                    <select name="exercise_id" required onchange="AdminCalendar.prefillOverride(this.value)">
                        <option value="">-- Seleccionar Ejercicio --</option>
                        ${exercises.map(ex => `<option value="${ex.id}" data-desc="${ex.description?.replace(/"/g, '&quot;')}" data-dur="${ex.duration}">${ex.name}</option>`).join('')}
                    </select>
                    <input type="number" name="custom_duration" id="ov-dur" placeholder="Duración (minutos)" required>
                    <textarea name="custom_description" id="ov-desc" placeholder="Notas personalizadas para este día..." style="height:120px"></textarea>
                    <button type="submit" class="btn btn-primary btn-full" style="background:var(--text); color:white; height:60px">GUARDAR EN PLAN</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('assign-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            data.user_email = email; data.date = date;
            await fetch('api/assignments.php?action=assign', { method: 'POST', body: JSON.stringify(data) });
            modal.remove();
            AdminCalendar.renderUserWeek(document.getElementById('admin-user-calendar-container'), email, AdminCalendar.currentViewDate);
        };
    },

    prefillOverride: function(id) {
        const sel = document.querySelector('select[name="exercise_id"]');
        const opt = sel.options[sel.selectedIndex];
        if (opt && opt.dataset.dur) {
            document.getElementById('ov-dur').value = opt.dataset.dur;
            document.getElementById('ov-desc').value = opt.dataset.desc;
        }
    },

    deleteAssignment: async (id, email, date) => {
        if (!confirm('¿Eliminar asignación?')) return;
        await fetch(`api/assignments.php?action=delete&id=${id}`);
        AdminCalendar.renderUserWeek(document.getElementById('admin-user-calendar-container'), email, AdminCalendar.currentViewDate);
    }
};