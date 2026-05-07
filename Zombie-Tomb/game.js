import { auth, db } from '../Signin_UDU_Studios/firebase_config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const loginLink = document.getElementById('login-link');

console.log("🖥️ 1. Iniciando escáner de UDU Studios...");

const authTimeout = setTimeout(() => {
    if (loginLink.innerText.includes("Verificando")) {
        resetToLogin();
        console.warn("⚠️ 2. Tiempo agotado: Firebase no respondió a tiempo.");
    }
}, 7000); 

onAuthStateChanged(auth, async (user) => {
    clearTimeout(authTimeout); // Apagamos el cronómetro de seguridad
    
    if (user) {
        console.log("✅ 3. ¡Usuario detectado en Auth! UID:", user.uid);
        try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("✅ 4. Datos encontrados en la Base de Datos.");
                const userData = docSnap.data();
                const nombre = userData.nombreUsuario;
                
                if (userData.rango === "UDU_Studios-Account") {
                    loginLink.innerHTML = `<span class="verified-badge">🔹</span> ${nombre}`;
                    loginLink.classList.add('admin-glow');
                } else {
                    loginLink.innerHTML = `👤 ${nombre}`;
                    loginLink.classList.add('user-blue');
                }
                loginLink.href = "../Signin_UDU_Studios/account/index.html";
                console.log("🚀 5. Acceso concedido y botón actualizado.");
            } else {
                console.warn("❌ 4. El usuario existe, pero NO tiene datos guardados en Firestore.");
                resetToLogin();
            }
        } catch (error) {
            console.error("❌ 4. Error al conectar con Firestore:", error);
            resetToLogin();
        }
    } else {
        console.log("🛑 3. No se detectó ninguna sesión activa en este dominio.");
        resetToLogin();
    }
});

function resetToLogin() {
    loginLink.innerHTML = "Iniciar Sesión";
    loginLink.classList.remove('user-blue', 'admin-glow');
    loginLink.href = "../Signin_UDU_Studios/index.html";
}

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

// Esto detecta en automático cuando el usuario entra al sitio
onAuthStateChanged(auth, (user) => {
    if (user) {
        cargarDatosDesdeNube(user);
    }
});

async function cargarDatosDesdeNube(user) {
    const userRef = doc(db, "usuarios", user.uid); 
    const snap = await getDoc(userRef);
    
    if (snap.exists() && snap.data()["ZT-data"]) {
        const cloudData = snap.data()["ZT-data"];
        
        // Actualizamos las variables del juego
        progreso.monedas = cloudData.recolectedCoins;
        progreso.puntos = cloudData.recolectedPoints;
        progreso.nivelMax = cloudData.levelsPlayed;
        
        // Cargar skins
        skinsCompradas = ['default'];
        if (cloudData.shopping.skinRoja) skinsCompradas.push('skin_red');
        if (cloudData.shopping.skinAzul) skinsCompradas.push('skin_blue');
        if (cloudData.shopping.skinMorada) skinsCompradas.push('skin_purple');
        if (cloudData.shopping.skinMulticolor) skinsCompradas.push('skin_multicolor1');
        
        // Actualizamos la UI
        document.getElementById('total-points').innerText = progreso.puntos;
        renderizarNiveles(); // Actualizamos los candados visuales
        console.log("Datos de ZT cargados desde la nube.");
    }
}

async function sincronizacion() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "usuarios", user.uid);
    
    try {
        const userSnap = await getDoc(userRef);
        
        const dataInicialZT = {
            "ZT-data": {
                recolectedPoints: 0,
                recolectedCoins: 0,
                levelsPlayed: 1,
                shopping: {
                    skinRoja: false, skinMorada: false, skinAzul: false, skinMulticolor: false, protection: false
                }
            }
        };

        if (!userSnap.exists() || !userSnap.data()["ZT-data"]) {
            // Creamos la carpeta ZT-data por primera vez
            await setDoc(userRef, dataInicialZT, { merge: true });
        } else {
            // Actualizamos los datos
            await updateDoc(userRef, {
                "ZT-data.recolectedPoints": progreso.puntos,
                "ZT-data.recolectedCoins": progreso.monedas,
                "ZT-data.levelsPlayed": progreso.nivelMax,
                "ZT-data.shopping.skinRoja": skinsCompradas.includes('skin_red'),
                "ZT-data.shopping.skinAzul": skinsCompradas.includes('skin_blue'),
                "ZT-data.shopping.skinMorada": skinsCompradas.includes('skin_purple'),
                "ZT-data.shopping.skinMulticolor": skinsCompradas.includes('skin_multicolor1')
            });
        }
        console.log("¡Progreso guardado en la bóveda de Firebase!");
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}
// ------------------------------------

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

    // Forzamos la carga con la ruta exacta
    this.load.image('img_moneda', 'assets/items/money.png');
    this.load.image('img_punto', 'assets/items/point.png');
    this.load.image('img_portal', 'assets/items/portal.png');

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
    this.falsos = this.physics.add.group();
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
                let punto = this.puntos.create(posX, posY, 'img_punto');
                // Escala y tamaño perfectos
                punto.setDisplaySize(15, 15); 
                punto.body.setCircle(6);
                punto.body.setOffset(4, 4);
                
                // Aseguramos que se queden fijas en el mapa
                punto.setScrollFactor(1); 
                this.puntos.add(punto);
            } else if (valor === "o") {
                // Espacio vacío, no hace nada
            } else if (valor === "Z") {
                crearPatrullero(this, posX, posY, 100); 
            } else if (valor === "m") {
                let moneda = this.monedas.create(posX, posY, 'img_moneda');

                // Escala y tamaño perfectos
                moneda.setDisplaySize(24, 24); 
                moneda.body.setCircle(6);
                moneda.body.setOffset(6, 6);
                
                // Aseguramos que se queden fijas en el mapa
                moneda.setScrollFactor(1); 
            } else if (valor === 'P') {
                // Guardamos la posición del spawn del jugador
                spawnX = posX;
                spawnY = posY;
            } else if (valor === 'f') {
                // Creamos el bloque invisible (trampa) usando un rectángulo nativo de Phaser
                let sensor = this.falsos.create(posX, posY, null);
                sensor.setVisible(false); // Lo hacemos invisible al inicio
                
                // Ajustamos la hitbox física para que sea muy pequeña en el centro
                sensor.body.setSize(4, 4);
                sensor.body.setOffset(10, 10);
            } else if (valor === "S") {
    // 1. Creamos el portal usando tu imagen 'img_portal'
    // Lo creamos directamente en el grupo de portales para que tenga físicas
    let portal = this.portales.create(posX, posY, 'img_portal');

    // 2. Ajustamos el tamaño para que encaje en el tile (24x24)
    portal.setDisplaySize(24, 24);

    // 3. Opcional: Ajustar el hitbox del portal si quieres que sea más preciso
    portal.body.setSize(20, 20);

    // 4. Tu animación de brillo (la mantenemos igual, ¡funciona perfecto con imágenes!)
    this.tweens.add({
        targets: portal,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
}
        });
    });

    // Calculamos el ancho y alto real del mapa basado en tu array
    const mapaAncho = datosNivel.mapa[0].split(',').length * tileSize;
    const mapaAlto = datosNivel.mapa.length * tileSize;
 
    // Le decimos a la física y a la cámara cuáles son los límites del mundo  
    this.physics.world.setBounds(0, 0, mapaAncho, mapaAlto);
    this.cameras.main.setBounds(0, 0, mapaAncho, mapaAlto);

    // --- 3. CREAR AL JUGADOR EN EL LUGAR DE LA "P" ---
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle');

    // Escala e Hitbox minúsculo
    this.player.setScale(1); 
    this.player.body.setSize(22, 22); 

    // Centrado perfecto
    this.player.body.setOffset(
        (this.player.width - this.player.body.width) / 2,
        (this.player.height - this.player.body.height) / 2
    );

    // Cámara sigue al jugador de forma suave (lerp)
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

    this.physics.add.overlap(this.player, this.puntos, (player, punto) => { 
        punto.destroy();
        progreso.puntos = parseInt(progreso.puntos) + 1;
        // YA NO GUARDAMOS AQUÍ PARA NO SATURAR EL SERVIDOR
        this.scoreText.setText('Puntos: ' + progreso.puntos);
        document.getElementById('total-points').innerText = progreso.puntos;
    }, null, this);
    
    this.physics.add.overlap(this.player, this.monedas, (player, moneda) => { 
        moneda.destroy();
        progreso.monedas = parseInt(progreso.monedas) + 1;
        // YA NO GUARDAMOS AQUÍ
        this.textoMonedas.setText('Monedas: ' + progreso.monedas);
    }, null, this);

    this.physics.add.overlap(this.player, this.portales, () => {
        // Aumentamos el nivel si es necesario
        if (currentLevel === parseInt(progreso.nivelMax)) {
            progreso.nivelMax++;
        }

        // ¡EL JUGADOR GANÓ EL NIVEL! GUARDAMOS TODO EN FIREBASE AHORA
        sincronizacion();

        alert("¡Nivel completado!");

        this.scene.stop(); 
        document.getElementById('level-selector').style.display = 'flex';
        renderizarNiveles(); 
    }, null, this);
    
    // Detectar deslizamiento en pantalla táctil (Swipe)
    this.input.on('pointerup', (pointer) => {
        const swipeThreshold = 50; 
        const distX = pointer.upX - pointer.downX;
        const distY = pointer.upY - pointer.downY;

        if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
            if (Math.abs(distX) > Math.abs(distY)) {
                if (Math.abs(distX) > swipeThreshold) {
                    if (distX > 0) this.player.body.setVelocityX(400); 
                    else this.player.body.setVelocityX(-400); 
                }
            } else {
                if (Math.abs(distY) > swipeThreshold) {
                    if (distY > 0) this.player.body.setVelocityY(400); 
                    else this.player.body.setVelocityY(-400); 
                }
            }
        }
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    // Textos de Interfaz (Fijados a la cámara)
    this.scoreText = this.add.text(59, 105, 'Puntos: ' + progreso.puntos, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 5, y: 5 }
    });
    this.scoreText.setScrollFactor(0).setDepth(100).setScale(1 / miZoom);

    this.textoMonedas = this.add.text(59, 120, 'Monedas: ' + progreso.monedas, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 5, y: 5 },
    });
    this.textoMonedas.setScrollFactor(0).setDepth(100).setScale(1 / miZoom);

    // --- BOTÓN DE ABANDONAR ---
    this.btnAbandonar = this.add.text(300, 105, '✕ ABANDONAR', {
        fontSize: '16px',
        fill: '#ff4d4d',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 8, y: 5 }
    });

    this.btnAbandonar.setScrollFactor(0).setDepth(100).setOrigin(1, 0).setScale(1 / miZoom);
    this.btnAbandonar.setInteractive({ useHandCursor: true });

    this.btnAbandonar.on('pointerover', () => {
        this.btnAbandonar.setStyle({ fill: '#ffffff', backgroundColor: '#ff0000' });
    });
    this.btnAbandonar.on('pointerout', () => {
        this.btnAbandonar.setStyle({ fill: '#ff4d4d', backgroundColor: 'rgba(0,0,0,0.6)' });
    });

    this.btnAbandonar.on('pointerdown', () => {
        if (confirm("¿Seguro que quieres abandonar? Guardaremos tus puntos y monedas, pero perderás el progreso de este nivel.")) {
            // Guardamos el dinero y puntos que haya agarrado antes de huir
            sincronizacion(); 
            
            this.scene.stop();
            document.getElementById('level-selector').style.display = 'flex';
            renderizarNiveles();
        }
    });

    // --- LÓGICA DE TRAMPA DEFINITIVA (Fórmula UDU Studios) ---
    this.physics.add.overlap(this.player, this.falsos, (player, sensor) => {
        // 1. Dibujamos un rectángulo de muro real encima del sensor que se pisó
        let muroVisual = this.add.rectangle(sensor.x, sensor.y, tileSize, tileSize, 0x4a0080);
        
        // 2. Añadimos ese nuevo objeto visual al grupo estático de muros sólidos
        this.muros.add(muroVisual);
        
        // 3. Eliminamos el sensor invisible para que no vuelva a activarse dos veces
        sensor.destroy();

        // 4. Feedback en pantalla para asustar al jugador
        this.cameras.main.flash(100, 255, 0, 0, 0.2); 
        console.log("¡Trampa activada! El pasillo se ha cerrado.");
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