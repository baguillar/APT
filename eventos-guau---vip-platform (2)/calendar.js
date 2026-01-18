// calendar.js - VIP Training Plan System v19.5
(function() {
    window.Calendar = {
        currentWeekStart: null,

        initDate: function() {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - (day === 0 ? 6 : day - 1); 
            this.currentWeekStart = new Date(today.setDate(diff));
            this.currentWeekStart.setHours(0,0,0,0);
        },

        safeFetchJson: async function(url) {
            const r = await fetch(url);
            const text = await r.text();
            if (!r.ok) return { error: true, status: r.status };
            try { return JSON.parse(text); } catch (e) { return { error: true, malformed: true }; }
        },

        renderClientCalendar: async function(container) {
            if (!this.currentWeekStart) this.initDate();
            UX.showLoader();

            try {
                const startStr = this.currentWeekStart.toISOString().split('T')[0];
                const [resProfile, resAssignments, resLives] = await Promise.all([
                    this.safeFetchJson('api/users.php?action=get_profile'),
                    this.safeFetchJson(`api/assignments.php?action=get_week&start=${startStr}`),
                    this.safeFetchJson('api/lives.php?action=get_current')
                ]);

                const assignments = Array.isArray(resAssignments) ? resAssignments : [];
                const plannedDays = resProfile.training_days ? resProfile.training_days.split(',') : [];

                container.innerHTML = `
                    <div class="dashboard-grid animate-in">
                        ${this.renderLiveBanner(resLives, resProfile)}
                        
                        <div style="display:grid; grid-template-columns: 1fr 300px; gap:2rem">
                            <section class="card" style="padding:2rem">
                                <h2 style="font-size:1.1rem; font-weight:900; margin-bottom:1rem">Mis Días de Entrenamiento</h2>
                                <div class="days-row">
                                    ${['L','M','X','J','V','S','D'].map((d, i) => `
                                        <div class="day-selector">
                                            <input type="checkbox" id="plan-day-${i+1}" value="${i+1}" ${plannedDays.includes(String(i+1)) ? 'checked' : ''} onchange="Calendar.updatePlannedDays()">
                                            <label for="plan-day-${i+1}">${d}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>

                            <section class="card" style="background:var(--text); color:white; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center">
                                <h4 style="font-size:0.8rem; font-weight:900; margin-bottom:0.5rem">VALORACI&Oacute;N INICIAL</h4>
                                <button class="btn btn-primary" onclick="window.open('https://forms.gle/vuestro-formulario', '_blank')" style="font-size:0.7rem; padding:0.8rem 1.5rem">RECURSOS VIP ↗</button>
                            </section>
                        </div>

                        <section class="calendar-section">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem">
                                <div>
                                    <h2 style="font-size:1.8rem; font-weight:900">Plan de ${resProfile.dogName || 'tu perro'}</h2>
                                    <p style="opacity:0.6; font-weight:600">Semana del ${this.currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div style="display:flex; gap:0.6rem">
                                    <button class="btn btn-outline" onclick="ICS.download()">📅 CALENDARIO</button>
                                    <button class="btn btn-primary" onclick="PDF.exportWeek()">🖨️ IMPRIMIR</button>
                                </div>
                            </div>

                            <div style="display:flex; align-items:center; gap:1rem">
                                <button class="btn btn-outline" style="border-radius:50%; width:45px; height:45px; padding:0; justify-content:center" onclick="Calendar.changeWeek(-7)">◀</button>
                                <div class="calendar-grid" style="flex:1">
                                    ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((name, i) => {
                                        const date = new Date(this.currentWeekStart);
                                        date.setDate(date.getDate() + i);
                                        const dateStr = date.toISOString().split('T')[0];
                                        const dayEx = assignments.filter(a => a.date === dateStr);
                                        return `
                                            <div class="calendar-day">
                                                <div class="day-header"><span class="day-name">${name}</span><span class="day-number">${date.getDate()}</span></div>
                                                <div class="day-content">
                                                    ${dayEx.map(a => `<div class="ex-pill ${a.completed ? 'completed' : ''}" onclick="Calendar.showDetails(${a.id})">${a.name} ${a.completed ? '✅' : ''}</div>`).join('')}
                                                    ${dayEx.length === 0 ? '<p style="opacity:0.1; font-size:0.6rem; text-align:center; margin-top:1rem">Libre</p>' : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <button class="btn btn-outline" style="border-radius:50%; width:45px; height:45px; padding:0; justify-content:center" onclick="Calendar.changeWeek(7)">▶</button>
                            </div>
                        </section>
                    </div>
                `;
            } catch (e) { throw e; } finally { UX.hideLoader(); }
        },

        renderLiveBanner: function(live, user) {
            if (!live || !live.date) return '';
            const hasAccess = user.subscription === 'premium';
            return `
                <div class="live-promo-banner animate-in">
                    <div>
                        <h3 style="font-weight:900; font-size:1.3rem">🎙️ Directo VIP Martes</h3>
                        <p style="opacity:0.8; font-size:0.9rem">${new Date(live.date).toLocaleDateString()} - ${live.description || 'Consulta semanal'}</p>
                    </div>
                    ${hasAccess ? `<button class="btn btn-primary" onclick="window.open('${live.live_url}', '_blank')">ENTRAR AHORA</button>` : `<button class="btn btn-primary" onclick="App.navigate('#/profile')">MEJORAR A PREMIUM</button>`}
                </div>
            `;
        },

        showDetails: async function(assignmentId) {
            UX.showLoader();
            try {
                const startStr = this.currentWeekStart.toISOString().split('T')[0];
                const res = await this.safeFetchJson(`api/assignments.php?action=get_week&start=${startStr}`);
                const a = res.find(x => x.id == assignmentId);
                const feedback = await this.safeFetchJson(`api/feedback.php?action=get_thread&assignment_id=${assignmentId}`);
                UX.hideLoader();

                const modal = document.createElement('div');
                modal.className = 'modal-overlay animate-in';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</span>
                        <div style="background:var(--text); padding:2rem; color:white; position:sticky; top:0; z-index:2">
                            <h2 style="font-weight:900; color:var(--primary)">${a.name}</h2>
                            <p style="opacity:0.7; font-size:0.8rem">${a.custom_duration || a.duration} MINUTOS</p>
                        </div>
                        <div style="padding:2rem">
                            <div style="border-radius:1rem; overflow:hidden; aspect-ratio:16/9; background:black">
                                ${(a.custom_video || a.videoURL) ? `<iframe src="${(a.custom_video || a.videoURL).replace('watch?v=', 'embed/')}" style="width:100%; height:100%; border:none" allowfullscreen></iframe>` : '<p style="color:white; text-align:center; padding-top:4rem">Video no disponible.</p>'}
                            </div>
                            <div style="margin-top:1.5rem; background:#f8fafc; padding:1.5rem; border-radius:1rem; border:1px solid #eee">
                                <h4 style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem">Instrucciones</h4>
                                <p style="font-size:0.95rem">${a.custom_description || a.original_desc || 'Sigue las indicaciones del video.'}</p>
                            </div>

                            <div style="margin-top:2rem">
                                <h4 style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:1rem">Dudas y Feedback</h4>
                                <div id="feedback-thread" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1.5rem">
                                    ${feedback && feedback.length > 0 ? feedback.map(f => `
                                        <div style="padding:1rem; border-radius:1rem; background:${f.admin_response ? '#fffdf5' : '#f1f5f9'}; border:${f.admin_response ? '1px solid var(--primary)' : '1px solid #e2e8f0'}">
                                            <p style="font-size:0.9rem"><strong>Tú:</strong> ${f.message}</p>
                                            ${f.admin_response ? `<p style="margin-top:0.5rem; font-size:0.9rem; color:var(--text); padding-top:0.5rem; border-top:1px dashed #ddd"><strong>Entrenador:</strong> ${f.admin_response}</p>` : '<p style="font-size:0.7rem; opacity:0.5; margin-top:0.5rem">Esperando respuesta...</p>'}
                                        </div>
                                    `).join('') : '<p style="opacity:0.4; font-size:0.8rem">No has enviado dudas sobre este ejercicio.</p>'}
                                </div>
                                <div style="display:flex; gap:0.5rem">
                                    <input type="text" id="new-doubt" placeholder="¿Tienes alguna duda?" style="flex:1">
                                    <button class="btn btn-primary" onclick="Calendar.sendDoubt(${a.id}, this)">ENVIAR</button>
                                </div>
                            </div>

                            <button class="btn btn-full ${a.completed ? 'btn-outline' : 'btn-primary'}" style="height:60px; margin-top:2.5rem" onclick="Calendar.toggleComplete(${a.id}, this)">
                                ${a.completed ? '✅ EJERCICIO REALIZADO' : 'MARCAR COMO COMPLETADO'}
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            } catch (e) { UX.hideLoader(); }
        },

        sendDoubt: async function(assignmentId, btn) {
            const msg = document.getElementById('new-doubt').value;
            if (!msg) return;
            btn.disabled = true;
            await fetch('api/feedback.php?action=send', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ assignment_id: assignmentId, message: msg })
            });
            UX.toast('Duda enviada al entrenador');
            document.querySelector('.modal-overlay').remove();
            this.showDetails(assignmentId);
        },

        toggleComplete: async function(id, btn) {
            UX.showLoader();
            const res = await fetch('api/assignments.php?action=complete', { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ id }) 
            }).then(r => r.json());
            UX.hideLoader();
            document.querySelector('.modal-overlay').remove();
            this.renderClientCalendar(document.getElementById('app-view'));
        },

        updatePlannedDays: async function() {
            const days = Array.from(document.querySelectorAll('.day-selector input:checked')).map(c => c.value).join(',');
            await fetch('api/users.php?action=update_training_days', { 
                method: 'POST', 
                headers: {'Content-Type':'application/json'}, 
                body: JSON.stringify({ training_days: days }) 
            });
            UX.toast('Días de entrenamiento guardados');
        },

        changeWeek: function(days) { 
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + days); 
            this.renderClientCalendar(document.getElementById('app-view')); 
        }
    };
})();