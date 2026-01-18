// pdf.js - Generador de Diario de Entrenamiento VIP
const PDF = {
    exportWeek: async () => {
        const startStr = Calendar.currentWeekStart.toISOString().split('T')[0];
        const res = await fetch(`api/assignments.php?action=get_week&start=${startStr}`).then(r => r.json());
        
        const weekLabel = Calendar.currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>DIARIO VIP - ${weekLabel}</title>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; color: #343344; padding: 40px; background: white; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #ffcc02; padding-bottom: 20px; margin-bottom: 40px; }
                    .header img { height: 60px; }
                    .title-box h1 { margin: 0; font-size: 24px; font-weight: 900; }
                    .title-box p { margin: 5px 0 0; opacity: 0.6; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: left; padding: 15px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #eee; }
                    td { padding: 20px 15px; border-bottom: 1px solid #eee; vertical-align: top; }
                    
                    .day-cell { width: 120px; font-weight: 900; color: #6b7280; }
                    .exercise-cell { width: 200px; }
                    .exercise-cell strong { display: block; font-size: 16px; margin-bottom: 5px; }
                    .instruction-cell { font-size: 13px; color: #4b5563; line-height: 1.4; }
                    .check-cell { width: 80px; text-align: center; }
                    .check-box { width: 30px; height: 30px; border: 2px solid #ccc; display: inline-block; margin-top: 5px; border-radius: 5px; }
                    .notes-cell { width: 150px; border-left: 1px dashed #ddd; }
                    
                    .footer { margin-top: 50px; font-size: 11px; text-align: center; opacity: 0.5; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title-box">
                        <h1>Log de Entrenamiento VIP</h1>
                        <p>Semana del ${weekLabel}</p>
                    </div>
                    <img src="https://eventosguau.es/wp-content/uploads/2024/08/Eventos-Guau-CON-BORDE-pequeno.png">
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>D&iacute;a</th>
                            <th>Ejercicio / Tiempo</th>
                            <th>Instrucciones Especiales</th>
                            <th>Hecho</th>
                            <th>Anotaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[0,1,2,3,4,5,6].map(i => {
                            const date = new Date(Calendar.currentWeekStart);
                            date.setDate(date.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                            const dayEx = res.filter(a => a.date === dateStr);

                            if (dayEx.length === 0) {
                                return `
                                    <tr>
                                        <td class="day-cell">${dayName}<br><small>${date.getDate()}/${date.getMonth()+1}</small></td>
                                        <td colspan="4" style="background:#fafafa; text-align:center; color:#ccc; font-style:italic">Descanso o actividad libre</td>
                                    </tr>
                                `;
                            }

                            return dayEx.map(ex => `
                                <tr>
                                    <td class="day-cell">${dayName}<br><small>${date.getDate()}/${date.getMonth()+1}</small></td>
                                    <td class="exercise-cell">
                                        <strong>${ex.name}</strong>
                                        <span style="background:#eee; padding:3px 8px; border-radius:10px; font-size:10px; font-weight:800">${ex.custom_duration || ex.duration} MIN</span>
                                    </td>
                                    <td class="instruction-cell">${ex.custom_description || ex.original_desc}</td>
                                    <td class="check-cell"><div class="check-box"></div></td>
                                    <td class="notes-cell"></td>
                                </tr>
                            `).join('');
                        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    &copy; ${new Date().getFullYear()} Eventos GUAU - Entrena con prop&oacute;sito. Registra tus progresos f&iacute;sicos en la plataforma.
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        win.document.close();
    }
};
