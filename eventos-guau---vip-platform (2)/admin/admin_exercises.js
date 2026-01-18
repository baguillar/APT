// admin/admin_exercises.js - Biblioteca Robusta
const AdminExercises = {
    allExercises: [],

    render: async function(container) {
        UX.showLoader();
        try {
            const exercises = await fetch('api/exercises.php?action=list').then(r => r.json());
            AdminExercises.allExercises = exercises;
            UX.hideLoader();

            container.innerHTML = `
                <div class="animate-in">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem">
                        <div>
                            <h2 style="font-weight:900; font-size:2rem">Biblioteca VIP</h2>
                            <p style="opacity:0.6">Gesti\u00f3n de ejercicios de entrenamiento.</p>
                        </div>
                        <div style="display:flex; gap:1rem">
                            <button class="btn btn-primary" onclick="AdminExercises.showCreateModal()">+ NUEVO</button>
                            <button class="btn btn-outline" onclick="AdminExercises.showImportModal()">IMPORTAR</button>
                        </div>
                    </div>

                    <div style="margin-bottom:2rem">
                        <input type="text" placeholder="Buscar ejercicio..." oninput="AdminExercises.filter(this.value)" style="max-width:400px">
                    </div>

                    <div id="exercises-grid-container" class="ex-grid">
                        ${AdminExercises.renderGrid(exercises)}
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(e);
            UX.hideLoader();
            UX.toast('Error al cargar la biblioteca', 'error');
        }
    },

    renderGrid: function(list) {
        if (!list || list.length === 0) {
            return `<div style="grid-column:1/-1; text-align:center; padding:5rem; background:white; border-radius:1.5rem">No hay ejercicios.</div>`;
        }
        return list.map(ex => `
            <div class="ex-card-premium">
                <div class="ex-card-icon">\ud83d\udc36</div>
                <h3>${ex.name}</h3>
                <p>${ex.description ? (ex.description.length > 80 ? ex.description.substring(0, 80) + '...' : ex.description) : 'Sin descripci\u00f3n.'}</p>
                <div class="ex-card-footer">
                    <span style="font-size:0.7rem; font-weight:800; background:#f1f5f9; padding:0.4rem 0.8rem; border-radius:0.5rem">${ex.duration} MIN</span>
                    <button class="btn" style="background:#fee2e2; color:#ef4444; padding:0.5rem 1rem; font-size:0.7rem; border-radius:0.8rem" onclick="AdminExercises.delete('${ex.id}')">BORRAR</button>
                </div>
            </div>
        `).join('');
    },

    filter: function(query) {
        const q = query.toLowerCase();
        const filtered = AdminExercises.allExercises.filter(ex => 
            ex.name.toLowerCase().includes(q) || (ex.description && ex.description.toLowerCase().includes(q))
        );
        document.getElementById('exercises-grid-container').innerHTML = AdminExercises.renderGrid(filtered);
    },

    showCreateModal: function() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay animate-in';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); backdrop-filter:blur(5px); z-index:2000;";
        
        modal.innerHTML = `
            <div class="card" style="width:90%; max-width:500px; padding:3rem">
                <h2 style="margin-bottom:2rem">Nuevo Ejercicio</h2>
                <form id="create-ex-form">
                    <input type="text" name="name" placeholder="Nombre" required>
                    <input type="number" name="duration" placeholder="Minutos" value="5" required>
                    <textarea name="description" placeholder="Instrucciones" style="height:100px"></textarea>
                    <input type="url" name="videoURL" placeholder="URL Video">
                    <div style="display:flex; gap:1rem; margin-top:1rem">
                        <button type="submit" class="btn btn-primary" style="flex:1">Guardar</button>
                        <button type="button" class="btn btn-outline" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('create-ex-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            UX.showLoader('Guardando...');
            await fetch('api/exercises.php?action=create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            UX.hideLoader();
            modal.remove();
            AdminExercises.render(document.getElementById('app-view'));
        };
    },

    showImportModal: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('csv', file);
            UX.showLoader('Importando...');
            await fetch('api/exercises.php?action=import_csv', { method: 'POST', body: formData });
            UX.hideLoader();
            AdminExercises.render(document.getElementById('app-view'));
        };
        input.click();
    },

    delete: async function(id) {
        if (!confirm('\u00bfEliminar este ejercicio?')) return;
        UX.showLoader();
        await fetch(`api/exercises.php?action=delete&id=${id}`);
        UX.hideLoader();
        AdminExercises.render(document.getElementById('app-view'));
    }
};