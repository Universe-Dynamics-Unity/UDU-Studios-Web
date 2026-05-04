// Función para bajar el volumen lentamente (Fade Out)
function fadeOutAndNav(targetUrl, isExit, historia, capitulo) {
    const iframe = document.getElementById('music-iframe');
    let volume = 100; // Empezamos al 100% (o el que tenga el usuario)
    
    // Intervalo que baja el volumen cada 100ms
    const fadeInterval = setInterval(() => {
        volume -= 10; // Bajamos de 10 en 10
        
        if (iframe) {
            const volumeData = JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [volume]
            });
            iframe.contentWindow.postMessage(volumeData, '*');
        }

        if (volume <= 0) {
            clearInterval(fadeInterval);
            
            // Una vez en silencio, ejecutamos la acción
            if (isExit) {
                // Lógica de guardado que ya tenías
                const progreso = {
                    historia: historia,
                    capitulo: capitulo,
                    fecha: new Date().toLocaleDateString()
                };
                localStorage.setItem('UDU_Progreso_' + historia, JSON.stringify(progreso));
                window.location.href = '../../index.html';
            } else {
                window.location.href = targetUrl;
            }
        }
    }, 150); // Velocidad del fade (150ms x 10 pasos = 1.5 segundos de transición)
}

// --- ACTUALIZAMOS LAS FUNCIONES QUE YA USAS ---

function saveAndExit(historiaNombre, capituloActual) {
    // En lugar de salir directo, llamamos al Fade Out
    fadeOutAndNav('../../index.html', true, historiaNombre, capituloActual);
}

function nextChapter(url) {
    // En lugar de ir directo, llamamos al Fade Out
    fadeOutAndNav(url, false);
}