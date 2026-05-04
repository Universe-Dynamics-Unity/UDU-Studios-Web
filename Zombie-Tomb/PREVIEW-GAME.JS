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

document.getElementById('btn-play').addEventListener('click', function() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('level-selector').style.display = 'flex';
    renderizarNiveles(); 
    // Nota: Ya no iniciamos 'new Phaser.Game' aquí. Eso solo debe pasar al tocar un nivel.
});

document.getElementById('btn-reset').addEventListener('click', () => {
    // 1. Pedir confirmación doble para evitar accidentes
    const confirmar1 = confirm("¿Estás seguro? Esto borrará TODOS tus puntos, monedas y skins compradas.");
    
    if (confirmar1) {
        const confirmar2 = confirm("¿Sin rencores? Esta acción no se puede deshacer. UDU Studios no podrá recuperar tus datos...");
        
        if (confirmar2) {
            // 2. LIMPIEZA TOTAL DEL ALMACENAMIENTO (LocalStorage)
            localStorage.removeItem('udu_nivelMax');
            localStorage.removeItem('udu_monedas');
            localStorage.removeItem('udu_puntos');
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
    // 1. Ocultamos el selector de niveles
    document.getElementById('level-selector').style.display = 'none';
    
    // 2. IMPORTANTE: Mostramos el menú con 'flex' para que respete tu CSS
    const mainMenu = document.getElementById('main-menu');
    mainMenu.style.display = 'block';
    
    // 3. Opcional: Reseteamos el scroll por si acaso
    mainMenu.scrollTop = 0;
};

function renderizarNiveles() {
    const container = document.getElementById('levels-container');
    if (!container) return; // Seguridad por si el contenedor no existe

    container.innerHTML = ''; 
    
    // Actualizamos el contador de monedas en la UI
    const coinDisplay = document.getElementById('total-points');
    if (coinDisplay) coinDisplay.innerText = progreso.puntos;

    // Generamos los 10 niveles
    for (let i = 1; i <= 10; i++) {
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
    for (let i = 1; i <= 10; i++) {
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

    // --- FABRICAR TEXTURA DE TRAMPA ---
    // Lo hacemos antes de leer el mapa para no saturar la memoria
    if (!this.textures.exists('trampa_texture')) {
        let graphics = this.add.graphics({ fillStyle: { color: 0x6a0dad } }); // Tu morado
        // Es mejor dibujarlo desde 0,0 para que cuadre perfecto en el grid
        graphics.fillRect(0, 0, 24, 24); 
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(0, 0, 24, 24);
        graphics.generateTexture('trampa_texture', 24, 24);
        graphics.destroy();
    }
    
    const mapaRaw = datosNivel.mapa;
    const tileSize = 24;

    this.muros = this.physics.add.staticGroup();
    this.portales = this.physics.add.staticGroup();
    this.monedas = this.physics.add.group();
    this.puntos = this.physics.add.group();
    this.zombies = this.physics.add.group();
    this.falsos = this.physics.add.staticGroup();
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
            // Cambia el bloque de la "f" (líneas 285-288) por esto:
            } else if (valor === 'f') {
            // Usamos 'muro' pero lo hacemos invisible al instante
                let sensor = this.falsos.create(posX, posY, 'muro').setVisible(false);
    
            // El sensor debe ser un punto pequeño para que no te choque antes de tiempo
                sensor.body.setSize(4, 4);
            } else if (valor === "S") {
                let portal = this.add.rectangle(posX, posY, tileSize, tileSize, 0x00ffff);
                this.portales.add(portal); 
    
            // Animación de brillo (opcional pero se ve genial)
            this.tweens.add({
                targets: portal,
                alpha: 0.5,
                duration: 500,
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

    this.physics.add.overlap(this.player, this.zombies, () => {
        alert("¡Un zombie te atrapó!");
        this.scene.restart();
    }, null, this);

    this.physics.add.overlap(this.player, this.puntos, (player, punto) => { punto.destroy();
    
    // 1. Sumar al progreso global (el que se guarda)
    progreso.puntos = parseInt(progreso.puntos) + 1;
    
    // 2. Guardar en el navegador para que no se pierda
    localStorage.setItem('udu_puntos', progreso.puntos);
    
    // 3. Actualizar los DOS textos: el de la pantalla y el del menú
    this.scoreText.setText('Puntos: ' + progreso.puntos);
    document.getElementById('total-points').innerText = progreso.puntos;
    
    console.log("Puntos totales guardados:", progreso.puntos);
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
   // Borra el bloque viejo de overlap y pega este:
this.physics.add.overlap(this.player, this.falsos, (player, sensor) => {
    const tX = sensor.x;
    const tY = sensor.y;

    // 1. Matamos el sensor para que no se active dos veces
    sensor.destroy();

    // 2. Efecto visual de UDU Studios
    this.cameras.main.flash(100, 255, 0, 0, 0.2);

    // 3. RETRASO DE 200ms: Te da tiempo de salir del cuadro antes de que aparezca el muro
    this.time.delayedCall(200, () => {
        // Creamos el muro visual morado
        let bloqueVisual = this.add.rectangle(tX, tY, 24, 24, 0x4a0080);
        
        // Le damos física sólida
        this.physics.add.existing(bloqueVisual, true);
        
        // Lo metemos al grupo de muros para que el jugador (y los zombies) choquen con él
        this.muros.add(bloqueVisual);
        
        console.log("¡Trampa cerrada con éxito!");
    });
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