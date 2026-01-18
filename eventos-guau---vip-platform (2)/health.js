// health.js - Behavioral Health Management (The VIP Semáforo)
(function() {
    window.Health = {
        colors: { physical: '#ffcc02', cognitive: '#6366f1', social: '#10b981', emotional: '#f43f5e' },

        renderStatus: async function(container) {
            UX.showLoader();
            try {
                const data = await fetch('api/users.php?action=get_health').then(r => r.json());
                const current = data.current || { physical: 5, cognitive: 5, social: 5, emotional: 5 };
                const pending = data.pending;
                const lastRequest = data.last_request;

                container.innerHTML = `
                    <div class="animate-in">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3rem">
                            <div><h2 class="premium-title">Salud Comportamental</h2><p class="premium-subtitle">Estado vital de ${App.user.dogName}</p></div>
                            <div style="text-align:right">
                                <span class="badge" style="background:${pending ? 'var(--primary-light)' : '#e2f9e1'}">
                                    ${pending ? '\u23f3 Propuesta en revisi\u00f3n' : '\u2705 Estado Actual'}
                                </span>
                            </div>
                        </div>

                        <div class="health-visual-container">
                            ${this.renderMeter('F\u00edsica', current.physical, this.colors.physical, '\ud83d\udcaa')}
                            ${this.renderMeter('Cognitiva', current.cognitive, this.colors.cognitive, '\ud83e\udde0')}
                            ${this.renderMeter('Social', current.social, this.colors.social, '\ud83d\udc15')}
                            ${this.renderMeter('Emocional', current.emotional, this.colors.emotional, '\u2764\ufe0f')}
                        </div>

                        ${lastRequest && lastRequest.admin_comment ? `
                            <div class="card" style="margin-top:2.5rem; background:#fffdf5; border:1px solid var(--primary)">
                                <h4 style="font-weight:900; margin-bottom:0.5rem">Feedback del Entrenador:</h4>
                                <p style="font-size:0.9rem; font-style:italic">"${lastRequest.admin_comment}"</p>
                            </div>
                        ` : ''}

                        ${!pending ? `
                        <div class="card" style="margin-top:4rem">
                            <div style="text-align:center; margin-bottom:2rem">
                                <h3 style="font-weight:900">\u00bfPropuesta de Evoluci\u00f3n?</h3>
                                <p style="font-size:0.85rem; color:var(--text-muted)">Si crees que tu perro ha mejorado, prop\u00f3n un cambio de nivel.</p>
                            </div>
                            <form id="health-request-form">
                                <div class="request-sliders-grid">
                                    ${this.renderSliderInput('physical', 'F\u00edsica', current.physical, this.colors.physical)}
                                    ${this.renderSliderInput('cognitive', 'Cognitiva', current.cognitive, this.colors.cognitive)}
                                    ${this.renderSliderInput('social', 'Social', current.social, this.colors.social)}
                                    ${this.renderSliderInput('emotional', 'Emocional', current.emotional, this.colors.emotional)}
                                </div>
                                <div style="margin-top:2rem">
                                    <textarea name="comment" required placeholder="Justifica el cambio para el entrenador..." style="height:100px"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary btn-full" style="margin-top:1.5rem">ENVIAR SOLICITUD DE REVISI\u00d3N</button>
                            </form>
                        </div>
                        ` : ''}
                    </div>
                `;

                if (document.getElementById('health-request-form')) {
                    document.getElementById('health-request-form').onsubmit = async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const payload = Object.fromEntries(formData.entries());
                        payload.color_physical = this.colors.physical;
                        payload.color_cognitive = this.colors.cognitive;
                        payload.color_social = this.colors.social;
                        payload.color_emotional = this.colors.emotional;
                        
                        UX.showLoader();
                        await fetch('api/users.php?action=request_health_review', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                        UX.toast('Propuesta enviada');
                        this.renderStatus(container);
                    };
                }
            } finally { UX.hideLoader(); }
        },

        renderMeter: (label, value, color, icon) => `<div class="health-meter-box"><div style="display:flex; justify-content:space-between; margin-bottom:0.5rem"><span style="font-weight:900">${icon} ${label}</span><span style="font-weight:900">${value}/10</span></div><div class="meter-track"><div class="meter-fill" style="width:${(value/10)*100}%; background:${color}"></div></div></div>`,
        renderSliderInput: (name, label, currentVal, color) => `<div style="background:#f8fafc; padding:1rem; border-radius:1rem"><label style="font-size:0.7rem; font-weight:800; text-transform:uppercase">${label}</label><div style="display:flex; align-items:center; gap:1rem"><input type="range" name="${name}" min="0" max="10" value="${currentVal}" style="flex:1; accent-color:${color}"><span style="font-weight:900">${currentVal}</span></div></div>`
    };
})();