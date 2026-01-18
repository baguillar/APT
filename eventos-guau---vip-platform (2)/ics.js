// ics.js - Generador de Calendario Dinámico VIP v5.0
const ICS = {
    download: async () => {
        UX.showLoader('Generando archivo...');
        const startStr = Calendar.currentWeekStart.toISOString().split('T')[0];
        const assignments = await fetch(`api/assignments.php?action=get_week&start=${startStr}`).then(r => r.json());
        
        if (assignments.length === 0) {
            UX.hideLoader();
            return UX.toast('No hay ejercicios asignados esta semana.', 'error');
        }

        const now = new Date().toISOString().replace(/-|:|\.\d+/g, '');
        
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Eventos GUAU//VIP Platform//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Plan VIP Eventos GUAU'
        ];

        assignments.forEach(a => {
            const d = new Date(a.date);
            d.setHours(9, 0, 0); // Notificación por la mañana
            const start = d.toISOString().replace(/-|:|\.\d+/g, '');
            d.setMinutes(d.getMinutes() + (a.custom_duration || a.duration));
            const end = d.toISOString().replace(/-|:|\.\d+/g, '');

            const videoLink = a.custom_video || a.videoURL || 'No disponible';
            const desc = a.custom_description || a.original_desc || 'Sin instrucciones adicionales.';

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${a.id}-${now}@eventosguau.es`);
            icsContent.push(`DTSTAMP:${now}`);
            icsContent.push(`DTSTART:${start}`);
            icsContent.push(`DTEND:${end}`);
            icsContent.push(`SUMMARY:Entrenar ${a.name} (Eventos GUAU VIP)`);
            // Se inyecta la descripción y el video directamente en el calendario del móvil
            icsContent.push(`DESCRIPTION:INSTRUCCIONES: ${desc.replace(/\n/g, ' ')}\\n\\nVIDEO: ${videoLink}\\n\\nPuedes entrar en la plataforma para dejar feedback o marcar como completado.`);
            icsContent.push('STATUS:CONFIRMED');
            icsContent.push('END:VEVENT');
        });

        icsContent.push('END:VCALENDAR');

        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `Entrenamiento_VIP_${App.user.dogName}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        UX.hideLoader();
        UX.toast('Calendario descargado. \u00a1Listo para importar!');
    }
};