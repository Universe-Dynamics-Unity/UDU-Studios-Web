// 1. Cargamos el progreso EXACTAMENTE como lo hace game.js
let monedasActuales = parseInt(localStorage.getItem('udu_monedas')) || 0;

// Creamos un nuevo guardado solo para saber qué hemos comprado
let skinsCompradas = JSON.parse(localStorage.getItem('udu_skins')) || ['default'];

// 2. Definimos los productos de la tienda (Catálogo de UDU Studios)
const catalogo = [
    { id: 'skin_blue', nombre: 'Skin Azul', precio: 100, img: 'assets/textures-shop/miniaturas/skin-blue-miniatura.png' },
    { id: 'skin_red', nombre: 'Skin Roja', precio: 100, img: 'assets/textures-shop/miniaturas/skin-red-miniatura.png' },
    { id: 'skin_purple', nombre: 'Skin Morada', precio: 100, img: 'assets/textures-shop/miniaturas/skin-purple-miniatura.png' },
    { id: 'skin_multicolor1', nombre: 'Skin Multicolor 1', precio: 120, img: 'assets/textures-shop/miniaturas/skin-multicolor1-miniatura.png' },
    { id: 'protection', nombre: 'Protección', precio: 170, img: 'assets/textures-shop/miniaturas/escudo-miniatura.png' }
];

function renderizarTienda() {
    const grid = document.getElementById('items-grid');
    const coinDisplay = document.getElementById('shop-coins');
    const pointsDisplay = document.getElementById('points');

    let puntosActuales = parseInt(localStorage.getItem('udu_puntos')) || 0;
    let skinPuesta = localStorage.getItem('udu_skin_equipada') || 'default'; 
        
    coinDisplay.innerText = monedasActuales;
    pointsDisplay.innerText = puntosActuales;
    grid.innerHTML = '';

    catalogo.forEach(item => {
        // 1. CREAMOS EL CONTENEDOR DEL ITEM
        const div = document.createElement('div');
        div.className = 'shop-item';

        // 2. CREAMOS EL BOTÓN PRIMERO (Para que no de error de "not defined")
        const btn = document.createElement('button');
        btn.className = 'btn-buy';

        // 3. APLICAMOS TU LÓGICA DE ESTADOS
        if (skinPuesta === item.id) {
            btn.innerText = "DESEQUIPAR";
            btn.style.background = "#bdc3c7"; 
            btn.style.color = "#2c3e50";
            btn.onclick = () => desequiparSkin();
        } else if (skinsCompradas.includes(item.id)) {
            btn.innerText = "EQUIPAR";
            btn.style.background = "#40ee97"; 
            btn.style.color = "#3d007a";
            btn.onclick = () => equiparSkin(item.id);
        } else {
            // ESTADO: No la tienes comprada
            if (monedasActuales >= item.precio) {
                // TIENES DINERO: Color normal (Amarillo)
                btn.innerText = `COMPRAR (${item.precio})`;
                btn.style.background = "#ffcc00";
                btn.style.color = "#3d007a";
                btn.onclick = () => comprar(item.id, item.precio);
            } else {
                // NO TIENES DINERO: Color Morado-Rosado (Bloqueado)
                btn.innerText = `FALTAN ${item.precio - monedasActuales} 🪙`;
                btn.style.background = "#8432aa"; // Morado vibrante
                btn.style.color = "#ff87ff";     // Rosa muy claro para contraste
                btn.style.cursor = "not-allowed"; // Cambia el cursor para indicar bloqueo
                btn.onclick = () => alert("¡Necesitas más monedas! Juega más niveles o canjea tus puntos.");
            }
        }

        // 4. ARMAMOS EL CONTENIDO DEL DIV
        div.innerHTML = `
            <img src="${item.img}" alt="${item.nombre}">
            <div class="item-info">
                <h3>${item.nombre}</h3>
                <p>Precio: ${item.precio} 🪙</p>
            </div>
        `;
        
        // 5. METEMOS EL BOTÓN DENTRO DEL DIV Y EL DIV AL GRID
        div.appendChild(btn);
        grid.appendChild(div);
    });
}

function comprar(id, precio) {
   if (monedasActuales >= precio) {
        if (id === 'protection') {
            // Lógica de acumulado
            let cantidadEscudos = parseInt(localStorage.getItem('udu_escudos_inventario')) || 0;
            cantidadEscudos += 1;
            localStorage.setItem('udu_escudos_inventario', cantidadEscudos);
            
            monedasActuales -= precio;
            localStorage.setItem('udu_monedas', monedasActuales);
            
            alert(`🛡️ ¡Escudo comprado! Tienes ${cantidadEscudos} en tu inventario.`);
        } else {
            // Lógica normal para skins...
            if (!skinsCompradas.includes(id)) {
                skinsCompradas.push(id);
                monedasActuales -= precio;
                localStorage.setItem('udu_monedas', monedasActuales);
                localStorage.setItem('udu_skins', JSON.stringify(skinsCompradas));
            }
        }
        renderizarTienda();
    } else {
        alert("❌ No tienes suficientes monedas.");
    }
}

function canjearPuntos() {
    let puntosActuales = parseInt(localStorage.getItem('udu_puntos')) || 0;

    if (puntosActuales >= 300) {
        // Restamos puntos y sumamos monedas
        puntosActuales -= 300;
        monedasActuales += 25;

        // Guardamos los dos cambios en el "disco duro" del navegador
        localStorage.setItem('udu_puntos', puntosActuales);
        localStorage.setItem('udu_monedas', monedasActuales);

        // Actualizamos la tienda para que se vea el cambio
        renderizarTienda();
        alert("¡Canje de monedas exitoso! Para guardar los cambios correctamente refresca la página.");
        renderizarTienda();

    } else {
        alert("¡Te faltan puntos! Sigue jugando para ganar más.");
    }
}

function equiparSkin(id) {
    // Solo skins (puedes añadir más IDs aquí si creas más skins)
    if (id === 'skin_blue' || id === 'skin_red' || id === 'skin_purple' || id === 'skin_multicolor1') {
        localStorage.setItem('udu_skin_equipada', id);
        alert("¡Skin equipada con éxito!");
        renderizarTienda(); 
    } else {
        alert("Este objeto es un potenciador y se activa solo en el nivel.");
    }
    location.reload()
}

function desequiparSkin() {
    // Volvemos al estado inicial
    localStorage.setItem('udu_skin_equipada', 'default');
    
    // Feedback para el usuario
    alert("Skin desequipada. Ahora verás al personaje original.");
    
    // Refrescamos la interfaz de la tienda
    renderizarTienda();
    location.reload()
}

// Iniciar al cargar la página
window.onload = renderizarTienda;
// 1. Esto dibuja los productos en pantalla
renderizarTienda();

// 2. Esto es para que el botón de "Volver" funcione si lo haces por JS
console.log("Tienda de Zombie Tomb cargada correctamente");