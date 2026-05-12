// ==========================================
// CONFIGURACIÓN DE UDU STUDIOS - ZOMBIE TOMB
// ==========================================
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a0033', // Color de fondo si la pantalla es más grande
    scale: {
        mode: Phaser.Scale.FIT, // Ajusta el juego al contenedor
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 360,  // Resolución base (formato vertical de celular)
        height: 640
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Cambia a true si quieres ver los cuadros de colisión
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game;
let currentLevel = 1;
let tieneEscudo = false; // variable para obtener si el jugador tiene el escudo o no
window.esInvulnerable = false; // Nueva variable de protección temporal

document.getElementById('btn-play').addEventListener('click', function() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('level-selector').style.display = 'flex';
    renderizarNiveles(); 
    // Nota: Ya no iniciamos 'new Phaser.Game' aquí. Eso solo debe pasar al tocar un nivel.
});

document.getElementById('btn-reset').addEventListener('click', () => {
    // 1. Pedir confirmación doble para evitar accidentes
    const confirmar1 = confirm("¿Estás seguro? Esto borrará TODOS tus puntos, monedas, escudos y skins compradas.");
    
    if (confirmar1) {
        const confirmar2 = confirm("¿Seguro al 100%? Esta acción no se puede deshacer. UDU Studios no podrá recuperar tus datos...");
        
        if (confirmar2) {
            // 2. LIMPIEZA TOTAL DEL ALMACENAMIENTO (LocalStorage)
            localStorage.removeItem('udu_nivelMax');
            localStorage.removeItem('udu_monedas');
            localStorage.removeItem('udu_puntos');
            localStorage.removeItem('udu_escudos_inventario'); // <-- Borra los escudos comprados
            localStorage.removeItem('udu_skins');          // <-- Borra la lista de compras
            localStorage.removeItem('udu_skin_equipada'); // <-- Quita la skin puesta y vuelve a la default 

            // 3. Reiniciar las variables en el código para esta sesión
            progreso.nivelMax = 1;
            progreso.monedas = 0;
            progreso.puntos = 0;

            // 4. Actualizar los textos de la pantalla del menú
            document.getElementById('total-points').innerText = "0";
            
            alert("¡Listo! Presiona 'Aceptar' para reiniciar para que se vuelva a cargar el sitio web.");
            
            // 5. Recargar la página para que el juego lea los valores vacíos
            location.reload();
        }
    }
});

// --- VARIABLES DE PROGRESO ---
let progreso = {
    nivelMax: localStorage.getItem('udu_nivelMax') || 1,
    monedas: localStorage.getItem('udu_monedas') || 0, // Valor M (Tienda)
    puntos: localStorage.getItem('udu_puntos') || 0,   // Valor 0 (Puntaje)
};

document.getElementById('btn-back-main').onclick = () => {
    location.reload();
};

function renderizarNiveles() {
    const container = document.getElementById('levels-container');
    if (!container) return; // Seguridad por si el contenedor no existe

    container.innerHTML = ''; 
    
    // Actualizamos el contador de monedas en la UI
    const coinDisplay = document.getElementById('total-points');
    if (coinDisplay) coinDisplay.innerText = progreso.puntos;

    // Generamos los 15 niveles, AQUÍ GENERA MÁS
    for (let i = 1; i <= 15; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-node';
        btn.innerText = i; 

        // Lógica de Desbloqueo
        if (i > progreso.nivelMax) {
            // NIVEL BLOQUEADO
            btn.classList.add('level-locked');
            btn.style.backgroundImage = "url('assets/ui/icon-buttonLevelYellow.png')";
            btn.disabled = true; // Evita que se pueda hacer clic
        } else {
            // NIVEL DISPONIBLE
            btn.style.backgroundImage = "url('assets/ui/icon-buttonLevelYellow.png')";
            btn.style.color = '#8800e2'; // Color púrpura para el número sobre fondo amarillo
            
            // Efectos visuales (Hover)
            btn.onmouseover = () => {
                btn.style.backgroundImage = "url('assets/ui/icon-buttonLevelPurple.png')";
                btn.style.color = "#ffffff"; 
            };
            btn.onmouseout = () => {
                btn.style.backgroundImage = "url('assets/ui/icon-buttonLevelYellow.png')";
                btn.style.color = "#8800e2";
            };
            
            // Acción al hacer clic
            btn.onclick = () => {
                iniciarJuego(i);
            };
        }

        container.appendChild(btn);
    }
}

function iniciarJuego(numNivel) {
    currentLevel = numNivel;

    // 1. Gestión de pantallas
    document.getElementById('level-selector').style.display = 'none';
    const contenedorJuego = document.getElementById('game-container');
    if (contenedorJuego) contenedorJuego.style.display = 'block';

    // 2. Lógica de Phaser
    if (!game) {
        // Si es la primera vez, creamos el juego
        game = new Phaser.Game(config);
    } else {
        // Si el juego ya existe, reiniciamos la escena principal
        // Esto cargará el nuevo currentLevel automáticamente
        game.scene.scenes[0].scene.restart();
    }
}

// ==========================================
// FUNCIONES DE PHASER
// ==========================================

function preload() {
    // 1. CARGA DE MAPAS (Esto se queda igual)
    for (let i = 1; i <= 15; i++) {
        let ruta = `niveles/nivel${i}/mapa${i === 1 ? '' : i}.json`;
        this.load.json(`mapaNivel${i}`, ruta);
    }

    // 2. CARGA DE ENEMIGOS (Zombies)
    this.load.image('zombie_idle', 'assets/sprites/enemy-sprites/zombie_idle.png');
    this.load.image('zombie_up', 'assets/sprites/enemy-sprites/zombie_up.png');
    this.load.image('zombie_down', 'assets/sprites/enemy-sprites/zombie_down.png');
    this.load.image('zombie_left', 'assets/sprites/enemy-sprites/zombie_left.png');
    this.load.image('zombie_right', 'assets/sprites/enemy-sprites/zombie_right.png');

    // 3. LÓGICA DE SKINS PARA EL JUGADOR
    const skinEquipada = localStorage.getItem('udu_skin_equipada') || 'default';
    
    let rutaBase = '';
    let prefijo = '';

    if (skinEquipada === 'skin_red') {
        rutaBase = 'assets/sprites/player-sprites/skins_player/skin_red/';
        prefijo = 'player_';
    } 
    else if (skinEquipada === 'skin_blue') {
        rutaBase = 'assets/sprites/player-sprites/skins_player/skin_blue/';
        prefijo = 'player_';
    } 
    else if (skinEquipada === 'skin_purple') {
        rutaBase = 'assets/sprites/player-sprites/skins_player/skin_purple/';
        prefijo = 'player_';
    } 
    else if (skinEquipada === 'skin_multicolor1') {
        rutaBase = 'assets/sprites/player-sprites/skins_player/skin_multicolor1/';
        prefijo = 'player_';
    } 
    else {
        // Skin original (Default)
        rutaBase = 'assets/sprites/player-sprites/';
        prefijo = 'player_';
    }

    // 4. CARGA DINÁMICA DE TEXTURAS DEL JUGADOR
    // Nota: Usamos la misma 'key' (ej: 'player_up') para que el resto del juego funcione igual
    this.load.image('player_idle',  rutaBase + prefijo + 'idle.png');
    this.load.image('player_up',    rutaBase + prefijo + 'up.png');
    this.load.image('player_down',  rutaBase + prefijo + 'down.png');
    this.load.image('player_left',  rutaBase + prefijo + 'left.png');
    this.load.image('player_right', rutaBase + prefijo + 'right.png');

    this.load.image('escudo_pixelArt', 'assets/ui/escudo_pixelArt.png'); // Usa tu ruta real
}

function create() {
    const claveMapa = `mapaNivel${currentLevel}`;
    const datosNivel = this.cache.json.get(claveMapa);
    
    // SEGURIDAD: Si el mapa no existe, avisamos y no seguimos
    if (!datosNivel || !datosNivel.mapa) {
        console.error("¡Ups!, ¡Error nuestro! No se encontró el laberinto en: " + claveMapa);
        alert("El archivo niveles/nivel" + (currentLevel === 1 ? "" : currentLevel) + ".json no se encontró o no existe aún :(. Vuelve a intentarlo más tarde");
        location.reload(); 
    }
    
    const mapaRaw = datosNivel.mapa;
    const tileSize = 24;

    this.muros = this.physics.add.staticGroup();
    this.portales = this.physics.add.staticGroup();
    this.monedas = this.physics.add.group();
    this.puntos = this.physics.add.group();
    this.zombies = this.physics.add.group();
    this.falsos = this.physics.add.group()
    this.score = 0; // Inicializamos el puntaje

    let spawnX = 36; 
    let spawnY = 36;

    // --- 1. DIBUJAR EL MAPA (Muros y Puntos) ---
    mapaRaw.forEach((filaString, y) => {
        const fila = filaString.split(','); 
        fila.forEach((valor, x) => {
            let posX = x * tileSize + tileSize/2;
            let posY = y * tileSize + tileSize/2;

            if (valor === "1") {
                let muro = this.add.rectangle(posX, posY, tileSize, tileSize, 0x4a0080);
                this.muros.add(muro);
            } else if (valor === "0") {
                let punto = this.add.circle(posX, posY, 4, 0xffff00);
                this.puntos.add(punto);
            } else if (valor === "o") {
            } else if (valor === "Z") {
                crearPatrullero(this, posX, posY, 100); 
            } else if (valor === "m") {
                let moneda = this.add.circle(posX, posY, 6, 0xffb300);
                this.monedas.add(moneda);
            } else if (valor === 'P') {
            // ¡Aquí está el truco! 
            // Guardamos la posición donde pusiste la P en el JSON
            spawnX = posX;
            spawnY = posY;
            // No creamos ningún objeto físico aquí para que actúe como "o" (espacio vacío)
            } else if (valor === 'f') {
                // 1. Usamos una imagen que YA exista para evitar el cuadro verde (muro)
    // 2. Le bajamos el alpha a 0 para que sea invisible
    let sensor = this.falsos.create(posX, posY, 'muro').setAlpha(0);
    
    // 3. ¡EL TRUCO! Hacemos el sensor minúsculo (4x4 píxeles) 
    // y lo centramos para que no se active por error
    sensor.body.setSize(4, 4);
    sensor.body.setOffset(10, 10);
                } else if (valor === "S") {
                let portal = this.add.rectangle(posX, posY, tileSize, tileSize, 0x00ffff);
                this.portales.add(portal); 
    
            // Animación de brillo (opcional pero se ve genial)
            this.tweens.add({
                targets: portal,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
          };
        });
     });

    // Calculamos el ancho y alto real del mapa basado en tu array
    const mapaAncho = datosNivel.mapa[0].split(',').length * tileSize;
    const mapaAlto = datosNivel.mapa.length * tileSize;
 
    // Le decimos a la física y a la cámara cuáles son los límites del mundo  
    this.physics.world.setBounds(0, 0, mapaAncho, mapaAlto);
    this.cameras.main.setBounds(0, 0, mapaAncho, mapaAlto);

    // --- 3. CREAR AL JUGADOR EN EL LUGAR DE LA "P" ---
    // Ahora usamos las variables que se actualizaron durante el ciclo del mapa
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle');

    // --- AQUÍ VA LA LÓGICA DEL ESCUDO (Después de crear al player) ---
let estadoEscudo = localStorage.getItem('udu_escudo_activo');
if (estadoEscudo === 'true') {
    tieneEscudo = true;
    // CREAMOS EL AURA (Un círculo dorado semi-transparente)
    this.aura = this.add.circle(this.player.x, this.player.y, 25, 0xffd700, 0.3);
    this.aura.setStrokeStyle(2, 0xffd700); // Borde brillante
    console.log("🛡️ Escudo de UDU Studios activo");
}

// 1. ESCALA GRANDE
this.player.setScale(1); 

// 2. EL TRUCO: Hitbox minúsculo en el centro
// Hacemos que la zona de choque sea de solo 40x40 píxeles.
// Esto es mucho más pequeño que los pasillos, así que NUNCA se trabará.
this.player.body.setSize(22, 22); 

// 3. CENTRADO PERFECTO:
// Esta fórmula pone el cuadro morado exactamente en el centro del dibujo grande.
this.player.body.setOffset(
    (this.player.width - this.player.body.width) / 2,
    (this.player.height - this.player.body.height) / 2
);

// La cámara sigue al jugador
// true: redondea píxeles para que no se vea borroso
// 0.1, 0.1: es el "lerp" (el retraso suave que querías)
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

const miZoom = 1.5;
this.cameras.main.setZoom(miZoom);

this.player.setCollideWorldBounds(true);
this.cameras.main.setRoundPixels(true);

    // --- 4. COLISIONES DEL JUGADOR ---
    this.physics.add.collider(this.player, this.muros);
    this.physics.add.collider(this.zombies, this.muros);

    // CAMBIO 1: En el paréntesis pusimos 'player' en vez de 'p'
this.physics.add.overlap(this.player, this.zombies, (player, zombie) => {
    if (esInvulnerable) return;

    if (tieneEscudo) {
        // DETENER EL RELOJ DE 15 SEGUNDOS porque ya se usó
        if (this.timerEscudo) this.timerEscudo.remove();

        tieneEscudo = false;
        esInvulnerable = true;
        player.clearTint();
        this.btnEscudo.clearTint(); // El botón vuelve a la normalidad
        zombie.destroy();

        // Efecto de parpadeo por 3 segundos
        this.tweens.add({
            targets: player,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 15,
            onComplete: () => {
                esInvulnerable = false;
                player.setAlpha(1);
            }
        });

        console.log("🛡️ ¡Escudo de UDU Studios utilizado!");
    } else {
        alert("¡Oh, no! Un zombie te atrapó. Buen intento.")
        this.scene.restart();
    }
}, null, this);

    this.physics.add.overlap(this.player, this.puntos, (player, punto) => { punto.destroy();
    
    // 1. Sumar al progreso global (el que se guarda)
    progreso.puntos = parseInt(progreso.puntos) + 1;
    
    // 2. Guardar en el navegador para que no se pierda
    localStorage.setItem('udu_puntos', progreso.puntos);
    
    // 3. Actualizar los DOS textos: el de la pantalla y el del menú
    this.scoreText.setText('Puntos: ' + progreso.puntos);
    document.getElementById('total-points').innerText = progreso.puntos;
    }, null, this);
    
    this.physics.add.overlap(this.player, this.monedas, (player, monedas) => { monedas.destroy();
    
    // 1. Sumar al progreso global (el que se guarda)
    progreso.monedas = parseInt(progreso.monedas) + 1;
    
    // 2. Guardar en el navegador para que no se pierda
    localStorage.setItem('udu_monedas', progreso.monedas);
    
    // 3. Actualizar los DOS textos: el de la pantalla y el del menú
    this.textoMonedas.setText('Monedas: ' + progreso.monedas);
    
    console.log("Monedas totales recogidas:", progreso.monedas);
    }, null, this);

    this.physics.add.overlap(this.player, this.portales, () => {
    // 1. Si pasamos el nivel más alto que teníamos, desbloqueamos el siguiente
    if (currentLevel === parseInt(progreso.nivelMax)) {
        progreso.nivelMax++;
        localStorage.setItem('udu_nivelMax', progreso.nivelMax);
    }

    // 2. Mensaje de victoria
    alert("¡Nivel completado!");

    // 3. Regresar al selector de niveles
    this.scene.stop(); // Reinicia Phaser para el próximo nivel
    document.getElementById('level-selector').style.display = 'flex';
    renderizarNiveles(); // Actualiza los botones (para que el nuevo nivel ya no sea gris)
    }, null, this);

    // Detectar deslizamiento en pantalla táctil
    this.input.on('pointerup', (pointer) => {
    const swipeThreshold = 50; // Distancia mínima para detectar el deslizamiento
    const distX = pointer.upX - pointer.downX;
    const distY = pointer.upY - pointer.downY;

    // Solo se mueve si el personaje está quieto
    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
        if (Math.abs(distX) > Math.abs(distY)) {
            if (Math.abs(distX) > swipeThreshold) {
                if (distX > 0) this.player.body.setVelocityX(400); // Derecha
                else this.player.body.setVelocityX(-400); // Izquierda
            }
        } else {
            if (Math.abs(distY) > swipeThreshold) {
                if (distY > 0) this.player.body.setVelocityY(400); // Abajo
                else this.player.body.setVelocityY(-400); // Arriba
            }
        }
    }
});
    this.cursors = this.input.keyboard.createCursorKeys();

    // Texto para el puntaje en la esquina (x: 10, y: 10)
    this.scoreText = this.add.text(59, 105, 'Puntos: ' + progreso.puntos, {
    fontSize: '18px',
    fill: '#ffffff',
    fontFamily: 'Arial',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: { x: 5, y: 5 }
    });
    this.scoreText.setScrollFactor(0); // Para que el texto no se mueva si la cámara se mueve
    this.scoreText.setDepth(100);     // Para que siempre esté encima de todo
    this.scoreText.setScale(1 / miZoom);

    this.textoMonedas = this.add.text(59, 120, 'Monedas: ' + progreso.monedas, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 5, y: 5 },
    });
    this.textoMonedas.setScrollFactor(0); // Para que el texto no se mueva si la cámara se mueve
    this.textoMonedas.setDepth(100);     // Para que siempre esté encima de todo
    this.textoMonedas.setScale(1 / miZoom);

    // --- BOTÓN DE ABANDONAR (DENTRO DEL JUEGO) ---
    this.btnAbandonar = this.add.text(300, 105, '✕ ABANDONAR', {
        fontSize: '16px',
        fill: '#ff4d4d',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 8, y: 5 }
    });

    // Lo fijamos a la cámara y lo ponemos a la derecha
    this.btnAbandonar.setScrollFactor(0).setDepth(100).setOrigin(1, 0);
    this.btnAbandonar.setInteractive({ useHandCursor: true });
    this.btnAbandonar.setScale(1 / miZoom);

    // Efectos visuales al pasar el mouse
    this.btnAbandonar.on('pointerover', () => {
        this.btnAbandonar.setStyle({ fill: '#ffffff', backgroundColor: '#ff0000' });
    });
    this.btnAbandonar.on('pointerout', () => {
        this.btnAbandonar.setStyle({ fill: '#ff4d4d', backgroundColor: 'rgba(0,0,0,0.6)' });
    });

    // Acción al hacer clic
    this.btnAbandonar.on('pointerdown', () => {
        if (confirm("¿Seguro que quieres abandonar? No se guardará el progreso.")) {
            // Regresamos al selector de niveles sin guardar progreso extra
            this.scene.stop();
            document.getElementById('level-selector').style.display = 'flex';
            renderizarNiveles();
        }
    });
    // --- LÓGICA DE TRAMPA DEFINITIVA (SIN CUADROS VERDES) ---
this.physics.add.overlap(this.player, this.falsos, (player, sensor) => {
    // 1. Le ponemos la imagen del muro de verdad
    this.add.rectangle(posX, posY, tileSize, tileSize, 0x4a0080);
    this.muros.add(muro);
    
    // 2. Lo hacemos visible (quitamos la transparencia)
    sensor.setAlpha(1);

    // 3. ¡EL PASO CLAVE! Lo volvemos sólido
    // Sacamos al sensor del grupo de "falsos" y lo metemos a "muros"
    this.falsos.remove(sensor);
    this.muros.add(sensor);

    // 4. Actualizamos el cuerpo físico para que bloquee al jugador
    // Esto hace que el cuadro de debug morado se vuelva verde (sólido)
    sensor.body.setImmovable(true);
    sensor.body.setSize(24, 24); // Recupera su tamaño real de pared
    sensor.body.setOffset(0, 0);

    // 5. El efecto de UDU Studios
    this.cameras.main.flash(100, 255, 0, 0, 0.2); 
    console.log("¡Trampa convertida en muro real!");
});

// Leer cuántos escudos tenemos guardados
    this.stockEscudos = parseInt(localStorage.getItem('udu_escudos_inventario')) || 0;

   // --- FONDO DEL BOTÓN (El rectángulo negro transparente) ---
let fondoBtn = this.add.graphics();
fondoBtn.fillStyle(0x000000, 0.5); // Color negro, 0.5 es la transparencia (Alpha)
// fillRoundedRect(x, y, ancho, alto, radio)
fondoBtn.fillRoundedRect(70, 473, 75, 50, 8); 
fondoBtn.setScrollFactor(0);
fondoBtn.setDepth(999); // Un nivel abajo del botón y el texto

// --- TU BOTÓN DEL ESCUDO ---
this.btnEscudo = this.add.image(100, 495, 'escudo_pixelArt')
    .setInteractive()
    .setScale(0.8)
    .setScrollFactor(0)
    .setDepth(1000);

// --- TU TEXTO ---
this.txtEscudos = this.add.text(110, 500, 'x' + this.stockEscudos, { 
    fontSize: '16px', 
    fill: '#a600d8',
    fontStyle: 'bold'
})
    .setScrollFactor(0)
    .setDepth(1001);

    // Lógica al hacer clic
    this.btnEscudo.on('pointerdown', () => {
        activarEscudoManual(this);
    });
}
    
function update() {
    if (!this.player || !this.player.body || !this.cursors) return;

    // Frenar si golpea pared
    if (this.player.body.blocked.up || this.player.body.blocked.down) this.player.body.setVelocityY(0);
    if (this.player.body.blocked.left || this.player.body.blocked.right) this.player.body.setVelocityX(0);

    // Movimiento Estilo Tomb of the Mask
    if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
        this.player.setTexture('player_idle');
        if (this.cursors.left.isDown) this.player.body.setVelocityX(-400);
        else if (this.cursors.right.isDown) this.player.body.setVelocityX(400);
        else if (this.cursors.up.isDown) this.player.body.setVelocityY(-400);
        else if (this.cursors.down.isDown) this.player.body.setVelocityY(400);
    } else {
        if (this.player.body.velocity.x < 0) this.player.setTexture('player_left');
        else if (this.player.body.velocity.x > 0) this.player.setTexture('player_right');
        else if (this.player.body.velocity.y < 0) this.player.setTexture('player_up');
        else if (this.player.body.velocity.y > 0) this.player.setTexture('player_down');
    }
    if (this.aura) {
        this.aura.setPosition(this.player.x, this.player.y);
    }
}

function activarEscudoManual(escena) {
    // 1. Verificar si tiene escudos y si NO está activo ya
    if (escena.stockEscudos > 0 && !tieneEscudo) {
        
        tieneEscudo = true;
        escena.stockEscudos -= 1;
        localStorage.setItem('udu_escudos_inventario', escena.stockEscudos);
        
        // Actualizar visuales
        escena.txtEscudos.setText('x' + escena.stockEscudos);
        escena.btnEscudo.setTint(0x808080); // Se pone gris
        escena.player.setTint(0x00ffff); // El aura o color azul
        
        console.log("🛡️ Escudo activado. Tienes 15 segundos!");

        // 2. Timer de 15 segundos (Si no lo usa, lo pierde)
        escena.timerEscudo = escena.time.delayedCall(15000, () => {
            if (tieneEscudo) { // Si después de 15s sigue en true (no chocó con zombie)
                tieneEscudo = false;
                escena.player.clearTint();
                escena.btnEscudo.clearTint(); // Vuelve a estar disponible
                console.log("⏰ Se acabó el tiempo del escudo. ¡Lo perdiste!");
            }
        });
    }
}

// --- ESTA FUNCIÓN VA AL FINAL DE TODO TU ARCHIVO ---
function crearPatrullero(escena, x, y) {
    // 1. Verificamos si la imagen del zombie existe para que no se congele el juego
    let imagenZ = escena.textures.exists('zombie_idle') ? 'zombie_idle' : null;
    let zombie;

    if (imagenZ) {
        // Si la imagen cargó bien (el zombie vive)
        zombie = escena.zombies.create(x, y, 'zombie_idle');
    } else {
        // Si hay error 404, creamos un zombie de emergencia (cuadrado verde)
        console.warn("⚠️ UDU Studios Alert: 'zombie_idle' no encontrado. Usando zombie de emergencia.");
        zombie = escena.add.rectangle(x, y, 24, 24, 0x00ff00);
        escena.physics.add.existing(zombie); // Le damos física para que pueda chocar
        escena.zombies.add(zombie); // Lo unimos al grupo de enemigos
    }
    
    // 2. Configuración física del zombie
    zombie.setDepth(10);
    zombie.body.setCollideWorldBounds(true);
    zombie.body.setBounce(1, 0); // Rebota al chocar con paredes
    zombie.body.setVelocityX(150); // Empieza caminando a la derecha
}

// ==========================================
// UDU STUDIOS - DEVELOPER COMMANDS (CONSOLE)
// ==========================================
window.udu = {
    // 1. Comando para Dinero y Puntos
    setMoney: (cantidad) => {
        localStorage.setItem('udu_monedas', cantidad);
        console.log(`💰 UDU Debug: Monedas ajustadas a ${cantidad}. Refresca la tienda para ver cambios.`);
    },
    setPuntos: (cantidad) => {
        localStorage.setItem('udu_puntos', cantidad);
        console.log(`⭐ UDU Debug: Puntos ajustados a ${cantidad}.`);
    },

    // 2. Comando para Escudos en Inventario
    setShields: (cantidad) => {
        localStorage.setItem('udu_escudos_inventario', cantidad);
        console.log(`🛡️ UDU Debug: Ahora tienes ${cantidad} escudos en el inventario.`);
    },

    // 3. Hack de Inmortalidad Total (Para que nada te mate)
    godMode: (activar) => {
        esInvulnerable = activar;
        console.log(activar ? "👼 GOD MODE: ON (Eres inmortal)" : "💀 GOD MODE: OFF (Cuidado ahí fuera)");
    },

    // 4. Desbloquear todas las skins de golpe
    unlockAllSkins: () => {
        const todas = ['skin_blue', 'skin_red', 'skin_purple', 'skin_multicolor1', 'protection'];
        localStorage.setItem('udu_skins', JSON.stringify(todas));
        console.log("🔓 UDU Debug: ¡Todas las skins desbloqueadas!");
    },

    // 5. Ayuda (Para que no se te olviden los comandos)
    help: () => {
        console.table([
            { Comando: "udu.setMoney(999)", Descripcion: "Cambia tu dinero" },
            { Comando: "udu.setShields(5)", Descripcion: "Añade escudos al inventario" },
            { Comando: "udu.godMode(true)", Descripcion: "Nadie te hace daño" },
            { Comando: "udu.unlockAllSkins()", Descripcion: "Desbloquea todo" }
        ]);
    },

   modeInvincible: () => {
        // Usamos window. para asegurar que encuentre la variable del juego
        window.esInvulnerable = true; 
        
        // ¡FEEDBACK VISUAL! El personaje se pondrá amarillo/dorado
        // Nota: Asegúrate de que 'game' y la escena existan
        if (game && game.scene.scenes[0] && game.scene.scenes[0].player) {
            game.scene.scenes[0].player.setTint(0xffff00); 
        }

        console.log("✅ UDU Debug: ¡MODO DIOS ACTIVADO! (Color Dorado)");
    },

    modeNormal: () => {
        window.esInvulnerable = false;
        
        // Quitar el color
        if (game && game.scene.scenes[0] && game.scene.scenes[0].player) {
            game.scene.scenes[0].player.clearTint();
        }

        console.log("💀 UDU Debug: Modo normal. ¡Ten cuidado!");
    },

    unlockAllLevels: () => {
        progreso.nivelMax = 15;
        console.log("Todos los niveles han sido desbloqueados en modo historia.")
    }
};