// ==========================================
// UDU STUDIOS - DEVELOPER COMMANDS (CONSOLE)
// ==========================================
window.udu = {
    // 1. Comando para Dinero y Puntos
    setMoney: (cantidad) => {
        localStorage.setItem('udu_monedas', cantidad);
        console.log(`💰 UDU Debug: Monedas ajustadas a ${cantidad}. Refresca la tienda para ver cambios.`);
        location.reload()
    },
    setPuntos: (cantidad) => {
        localStorage.setItem('udu_puntos', cantidad);
        console.log(`⭐ UDU Debug: Puntos ajustados a ${cantidad}.`);
        location.reload()
    },

    // 2. Comando para Escudos en Inventario
    setShields: (cantidad) => {
        localStorage.setItem('udu_escudos_inventario', cantidad);
        console.log(`🛡️ UDU Debug: Ahora tienes ${cantidad} escudos en el inventario.`);
    },

    // 3. Revisa si se activó correctamente la clase esInvulnerable (Para que nada me mate)
    godMode: (activar) => {
        esInvulnerable = activar;
        console.log(activar ? "👼 GOD MODE: ON (Eres inmortal)" : "💀 GOD MODE: OFF (Cuidado ahí fuera)");
    },

    // 4. Desbloquear todas las skins de golpe para debuguear o simplemente probarlas
    unlockAllSkins: () => {
        const todas = ['skin_blue', 'skin_red', 'skin_purple', 'skin_multicolor1', 'protection'];
        localStorage.setItem('udu_skins', JSON.stringify(todas));
        location.reload()
        console.log("🔓 UDU Debug: ¡Todas las skins desbloqueadas!");
    },

    // 5. Ayuda (Para que no se te olviden los comandos)
    help: () => {
        console.table([
            { Comando: "udu.setMoney(999)", Descripcion: "Cambia cuanto dinero tienes." },
            { Comando: "udu.setPuntos(999)", Descripcion: "Cambia cuantos puntos tienes."},
            { Comando: "udu.setShields(5)", Descripcion: "Añade escudos al inventario." },
            { Comando: "udu.godMode()", Descripcion: "Muestra si tienes el modo invulnerable o no."},
            { Comando: "udu.unlockAllSkins()", Descripcion: "Desbloquea todo." },
            { Comando: "udu.modoInvulnerable()", Descripcion: "Activa el modo invulnerable."},
            { Comando: "udu.modoVulnerable()", Descripcion: "Desactiva el modo invulnerable."},
            { Comando: "udu.unlockAllLevels()", Descripcion: "Desbloquea todos los niveles de golpe."}
        ]);
    },

   modoInvulnerable: () => {
        // Usamos window. para asegurar que encuentre la variable del juego
        window.esInvulnerable = true; 
        
        // ¡FEEDBACK VISUAL! El personaje se pondrá amarillo/dorado
        // Nota: Asegúrate de que 'game' y la escena existan
        if (game && game.scene.scenes[0] && game.scene.scenes[0].player) {
            game.scene.scenes[0].player.setTint(0x00ffff); 
        }

        console.log("✅ Activaste el modo invulnerable.");
    },

    modoVulnerable: () => {
        window.esInvulnerable = false;
        
        // Quitar el color
        if (game && game.scene.scenes[0] && game.scene.scenes[0].player) {
            game.scene.scenes[0].player.clearTint();
        }

        console.log("Desactivaste el modo invulnerable. ¡Ya eres vulnerable!");
    },

    unlockAllLevels: () => {
    
    // 1. Asigna el número total de niveles de tu juego (por ejemplo, si tienes 20 niveles)
    progreso.nivelMax = 25; // Puedes poner 99 si aún no sabes el límite exacto

    // 2. Guardas el nuevo valor en el almacenamiento del navegador
    localStorage.setItem('udu_nivelMax', progreso.nivelMax);

    // 3. (Opcional) Te lanzas un mensaje para confirmar que el comando funcionó
    console.log("Developer Command: Todos los niveles han sido desbloqueados.");
    alert("¡Todos los niveles desbloqueados! No se te olvide recargar la página.");
    },

    // 2. Comando para Escudos en Inventario
    setCongelar: (cantidad) => {
        localStorage.setItem('udu_congelamientos_inventario', cantidad);
        console.log(`❄️ UDU Debug: Ahora tienes ${cantidad} de boosters de congelamiento en el inventario.`);
    },
}

// Nota: Al subir una versión al público no se te olvide quitar esta parte de "game.js" para quitar
// acceso a comandos de Developer en Zombie Tomb