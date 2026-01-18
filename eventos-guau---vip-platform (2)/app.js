// app.js - VIP Engine v19.0 (Stability & Polish)
const App = {
    user: null,

    init: async function() {
        try {
            const authData = await Auth.check();
            if (authData && authData.logged) {
                this.user = authData.user;
                this.showApp();
                this.handleInitialRouting();
            } else { this.showAuth(); }
        } catch (e) { this.showAuth(); }
        window.addEventListener('hashchange', () => this.navigate(window.location.hash || '#/dashboard'));
    },

    handleInitialRouting: function() {
        if (!this.user) return this.showAuth();
        if (this.user.role === 'admin') { this.navigate('#/dashboard'); return; }
        if (!this.user.dogName || this.user.dogName === '...') { this.navigate('#/profile'); return; }
        this.navigate('#/dashboard');
    },

    showApp: function() {
        document.getElementById('auth-shell').classList.add('hidden');
        document.getElementById('app-shell').classList.remove('hidden');
        document.getElementById('user-display-name').textContent = this.user.dogName || 'VIP';
        this.renderNavigation();
    },

    showAuth: function() {
        const authShell = document.getElementById('auth-shell');
        authShell.classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        this.renderLogin(authShell);
    },

    renderNavigation: function() {
        const nav = document.getElementById('main-nav');
        if (this.user.role === 'admin') {
            nav.innerHTML = `
                <a href="#/dashboard" class="nav-link">Panel</a>
                <a href="#/admin-users" class="nav-link">Alumnos</a>
                <a href="#/admin-exercises" class="nav-link">Biblioteca</a>
                <a href="#/admin-lives" class="nav-link">Directos</a>
                <a href="#/admin-feedback" class="nav-link">Consultas</a>
                <a href="#/admin-health" class="nav-link">Salud</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="#/dashboard" class="nav-link">Plan Semanal</a>
                <a href="#/health" class="nav-link">Salud Vital</a>
                <a href="#/profile" class="nav-link">Mi Perfil</a>
            `;
        }
        const currentHash = window.location.hash || '#/dashboard';
        nav.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === currentHash) link.classList.add('active');
            else link.classList.remove('active');
        });
    },

    renderLogin: function(container) {
        container.innerHTML = `
            <div class="card" style="max-width:450px; margin: 4rem auto; text-align:center">
                <img src="https://eventosguau.es/wp-content/uploads/2024/08/Eventos-Guau-CON-BORDE-pequeno.png" style="height:80px; margin-bottom:2rem">
                <h2 style="font-weight:900; margin-bottom:0.5rem">Acceso VIP</h2>
                <form id="login-form">
                    <input type="email" name="email" placeholder="Email" required style="margin-bottom:1rem">
                    <input type="password" name="password" placeholder="Contraseña" required style="margin-bottom:1.5rem">
                    <button type="submit" class="btn btn-primary btn-full">Entrar en el Club</button>
                </form>
                <div id="login-error" style="color:#ef4444; margin-top:1rem; font-weight:800; font-size:0.8rem"></div>
            </div>
        `;
        document.getElementById('login-form').onsubmit = async (e) => {
            e.preventDefault();
            const { email, password } = Object.fromEntries(new FormData(e.target));
            UX.showLoader('Verificando...');
            const res = await Auth.login(email, password);
            UX.hideLoader();
            if (res.success) location.reload();
            else document.getElementById('login-error').textContent = '⚠️ ' + res.error;
        };
    },

    handleLogout: async function() {
        if (!confirm('¿Cerrar sesión VIP?')) return;
        UX.showLoader('Saliendo...');
        try { await Auth.logout(); } catch (e) {}
        this.user = null;
        window.location.replace(window.location.origin + window.location.pathname);
    },

    navigate: function(hash) {
        const view = hash.replace('#/', '') || 'dashboard';
        this.renderView(view);
        this.renderNavigation();
    },

    renderView: async function(view) {
        const container = document.getElementById('app-view');
        container.innerHTML = UX.skeleton();
        try {
            switch(view) {
                case 'dashboard': 
                    if (this.user.role === 'admin') await Admin.renderDashboard(container);
                    else await Calendar.renderClientCalendar(container); 
                    break;
                case 'health': await Health.renderStatus(container); break;
                case 'profile': await this.renderProfile(container); break;
                case 'admin-users': await Admin.renderUsers(container); break;
                case 'admin-exercises': await AdminExercises.render(container); break;
                case 'admin-lives': await AdminLives.render(container); break;
                case 'admin-feedback': await AdminFeedback.render(container); break;
                case 'admin-health': await AdminHealth.render(container); break;
                default: this.navigate('#/dashboard');
            }
        } catch (e) { 
            container.innerHTML = `<div class="card" style="text-align:center; padding:4rem"><h2 style="color:#ef4444">⚠️ Error</h2><button class="btn btn-primary" onclick="location.reload()">REINTENTAR</button></div>`; 
        }
    },

    renderProfile: async function(container) {
        UX.showLoader();
        try {
            const u = await fetch('api/users.php?action=get_profile').then(r => r.json());
            UX.hideLoader();

            let edadText = '---';
            if (u.dogBirthdate) {
                const birth = new Date(u.dogBirthdate);
                const diff = new Date().getTime() - birth.getTime();
                const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
                const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
                edadText = `${years} años y ${months} meses`;
            }

            container.innerHTML = `
                <div class="animate-in" style="max-width:1000px; margin:0 auto">
                    <div style="margin-bottom:2.5rem">
                        <h2 class="premium-title">Ficha VIP</h2>
                        <p style="opacity:0.6; font-weight:600">Configura tu perfil y gestiona tu suscripción.</p>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 300px; gap:2rem; align-items: start">
                        <form id="profile-form">
                            <div style="display:grid; gap:2rem">
                                <section class="card">
                                    <h3 style="font-size:1rem; font-weight:900; margin-bottom:1.5rem">👤 Datos Propietario</h3>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem">
                                        <div style="grid-column:1/-1"><label>Nombre Completo</label><input type="text" name="ownerName" value="${u.ownerName || ''}" required></div>
                                        <div><label>Teléfono</label><input type="tel" name="ownerPhone" value="${u.ownerPhone || ''}"></div>
                                        <div><label>Email</label><input type="email" value="${u.email}" disabled style="background:#f1f5f9"></div>
                                    </div>
                                </section>
                                <section class="card">
                                    <h3 style="font-size:1rem; font-weight:900; margin-bottom:1.5rem">🐕 Ficha Canina</h3>
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem">
                                        <div style="grid-column:1/-1"><label>Nombre del Perro</label><input type="text" name="dogName" value="${u.dogName || ''}" required></div>
                                        <div><label>Raza</label><input type="text" name="dogBreed" value="${u.dogBreed || ''}"></div>
                                        <div><label>Sexo</label><select name="dogSex"><option value="Macho" ${u.dogSex === 'Macho' ? 'selected' : ''}>Macho</option><option value="Hembra" ${u.dogSex === 'Hembra' ? 'selected' : ''}>Hembra</option></select></div>
                                        <div><label>Peso (Kg)</label><input type="number" step="0.1" name="dogWeight" value="${u.dogWeight || ''}"></div>
                                        <div><label>Fecha Nac.</label><input type="date" name="dogBirthdate" value="${u.dogBirthdate || ''}"></div>
                                        <div style="grid-column:1/-1"><p style="font-size:0.75rem; font-weight:800; opacity:0.5">EDAD ACTUAL: ${edadText}</p></div>
                                    </div>
                                </section>
                                <section class="card">
                                    <h3 style="font-size:1rem; font-weight:900; margin-bottom:1.5rem">🧠 Carácter y Objetivos</h3>
                                    <div style="display:grid; gap:1.2rem">
                                        <div><label>¿Cómo es tu perro?</label><textarea name="dogCharacter" style="height:100px">${u.dogCharacter || ''}</textarea></div>
                                        <div><label>¿Qué quieres conseguir?</label><textarea name="dogObjective" style="height:100px">${u.dogObjective || ''}</textarea></div>
                                    </div>
                                </section>
                                <button type="submit" class="btn btn-primary btn-full">GUARDAR CAMBIOS</button>
                            </div>
                        </form>

                        <aside>
                            <div class="card" style="background:var(--text); color:white; padding:2rem">
                                <span class="badge" style="background:var(--primary); color:black; margin-bottom:1rem">PLAN ${u.subscription.toUpperCase()}</span>
                                <h3 style="font-weight:900; margin-bottom:1rem">Suscripción VIP</h3>
                                <p style="font-size:0.8rem; opacity:0.7; margin-bottom:1.5rem">Para cambiar tu plan o gestionar el pago, utiliza nuestro formulario oficial.</p>
                                <a href="https://eventosguau.es/formulario-vip" target="_blank" class="btn btn-primary btn-full" style="font-size:0.7rem">GESTIONAR PLAN</a>
                            </div>
                        </aside>
                    </div>
                </div>
            `;

            document.getElementById('profile-form').onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target).entries());
                UX.showLoader('Guardando...');
                await fetch('api/users.php?action=update_profile', { 
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data) 
                });
                UX.hideLoader();
                UX.toast('¡Perfil actualizado!');
                location.reload();
            };
        } catch (e) { UX.hideLoader(); }
    }
};
window.App = App;
document.addEventListener('DOMContentLoaded', () => window.App.init());