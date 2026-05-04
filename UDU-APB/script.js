// --- CONFIGURACIÓN INICIAL ---
const totalLecciones = 4; // Actualiza este número conforme agregues más
let usuarioLogueado = JSON.parse(localStorage.getItem('ud_sesion')) || null;

// Al cargar la página, inicializamos todo
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    actualizarProgreso();
});

// --- 1. GESTIÓN DE SESIÓN ---
function iniciarSesion() {
    window.location.href = "../Signin_UDU_Studios/index.html";
}

function cerrarSesion() {
    if(confirm("¿Cerrar sesión? No te preocupes, esta acción no afectara a nada más que borrar tu progreso. Pero aunque pongas tu cuenta de nuevo no volverá tu progreso.")) {
        
        // 1. Borramos la sesión activas
        localStorage.removeItem('ud_sesion');

        // 2. Limpiamos todas las lecciones del almacenamiento local
        // Recorremos el total de lecciones para borrar cada una
        for (let i = 1; i <= totalLecciones; i++) {
            localStorage.removeItem(`leccion_${i}`);
        }

        // 3. Opcional: Si tienes otras cosas guardadas, puedes usar localStorage.clear() 
        // pero cuidado porque borraría la "DB" de usuarios también. 
        // Por eso es mejor borrar una por una como arriba.

        usuarioLogueado = null;

        // 4. Refrescamos la página para que la barrita vuelva a cero y los textos a "Pendiente"
        window.location.reload(); 
    }
}

function verificarSesion() {
    const authPromo = document.getElementById('auth-promo');
    if (usuarioLogueado) {
        authPromo.innerHTML = `
            <p>Conectado como: <strong>${usuarioLogueado.email}</strong></p>
            <button onclick="cerrarSesion()" style="background: #64748b; margin-top:10px;">Cerrar Sesión</button>
        `;
    } else {
        authPromo.innerHTML = `
            <p>¿Quieres asegurar tu progreso en la nube?</p>
            <button onclick="iniciarSesion()">Crear cuenta / Iniciar Sesión</button>
        `;
    }
}

function actualizarProgreso() {
    let leccionesCompletadas = 0;

    for (let i = 1; i <= totalLecciones; i++) {
        const idLeccion = `leccion_${i}`;
        const statusElement = document.getElementById(`status-l${i}`);
        const botonLeccion = document.getElementById(`btn-l${i}`);

        if (localStorage.getItem(idLeccion) === 'completado') {
            leccionesCompletadas++;
            if (statusElement) statusElement.innerText = "✅ Completado";
            if (botonLeccion) {
                botonLeccion.classList.remove('btn-locked');
                botonLeccion.innerText = "Repasar Lección";
                botonLeccion.style.pointerEvents = "auto";
                botonLeccion.style.opacity = "1";
            }
        } else {
            if (i === 1) {
                if (statusElement) statusElement.innerText = "⏳ Pendiente";
            } else {
                const leccionAnterior = localStorage.getItem(`leccion_${i-1}`);
                if (leccionAnterior === 'completado') {
                    if (statusElement) statusElement.innerText = "⏳ Disponible";
                    if (botonLeccion) {
                        botonLeccion.classList.remove('btn-locked');
                        botonLeccion.style.pointerEvents = "auto";
                        botonLeccion.style.opacity = "1";
                    }
                } else {
                    if (statusElement) statusElement.innerText = "🔒 Bloqueado";
                    if (botonLeccion) {
                        botonLeccion.classList.add('btn-locked');
                        botonLeccion.style.pointerEvents = "none";
                        botonLeccion.style.opacity = "0.5";
                    }
                }
            }
        }
    }

    // --- EL PARCHE DEL PORCENTAJE ---
    const porcentaje = Math.round((leccionesCompletadas / totalLecciones) * 100);
    const barra = document.getElementById('barra-progreso');
    const texto = document.getElementById('texto-progreso'); // ID corregido según tu HTML

    if (barra) barra.style.width = porcentaje + '%';
    if (texto) texto.innerText = `Progreso: ${porcentaje}%`;
}

function completarLeccion(idLeccion) {
    const clave = `leccion_${idLeccion}`;
    localStorage.setItem(clave, 'completado');

    if (usuarioLogueado) {
        // Inicializamos progreso si no existe
        if (!usuarioLogueado.progreso) usuarioLogueado.progreso = {};
        usuarioLogueado.progreso[clave] = 'completado';
        
        localStorage.setItem('ud_sesion', JSON.stringify(usuarioLogueado));
        
        // Solo intentamos mapear usuariosDB si la variable existe
        if (typeof usuariosDB !== 'undefined' && usuariosDB !== null) {
            usuariosDB = usuariosDB.map(u => u.email === usuarioLogueado.email ? usuarioLogueado : u);
            localStorage.setItem('ud_usuarios_db', JSON.stringify(usuariosDB));
        }
    }
    alert("¡Terminaste!, ¡Qué buen trabajo!");
    actualizarProgreso(); 
    window.location.href = "../index.html";
}

// --- SISTEMA DE EDITOR INTERACTIVO ---

function inicializarEditor(idLeccion, respuestaCorrecta) {
    const editor = document.getElementById('editor-codigo');
    const iframe = document.getElementById('visor-resultado');
    const btnValidar = document.getElementById('btn-validar');

    if (!editor || !iframe) return;

    // Función para renderizar lo que el usuario escribe
    editor.addEventListener('input', () => {
        const visor = iframe.contentWindow.document;
        visor.open();
        visor.write(editor.value);
        visor.close();

        // Validamos si el código es el correcto (limpiando espacios y minúsculas)
        const codigoLimpio = editor.value.toLowerCase().replace(/\s+/g, '');
        const respuestaLimpia = respuestaCorrecta.toLowerCase().replace(/\s+/g, '');

        if (codigoLimpio.includes(respuestaLimpia)) {
            btnValidar.style.display = 'block';
        }
    });
}

// Esta función se llama desde el botón final de la lección
function finalizarLeccionInteractiva(id) {
    completarLeccion(id); // Usa la función que ya tenemos para guardar
    alert("¡Misión cumplida en Universe Dynamics Unity!");
    window.location.href = "../index.html";
}