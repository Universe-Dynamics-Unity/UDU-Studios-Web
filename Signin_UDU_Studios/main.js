import { auth, db } from './firebase_config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const userInput = document.getElementById('username');

// --- BOTÓN REGISTRARSE ---
document.getElementById('btnRegistro').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;
    const username = userInput.value;

    if(username === "") { alert("¡Ponte un apodo antes de entrar!"); return; }

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            
            // Guardar datos en Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                nombreUsuario: username,
                correo: email,
                rango: "Developer",
                fechaRegistro: new Date()
            });

            // SALTO AL DASHBOARD
            window.location.href = "./dashboard.html";
        })
        .catch((error) => alert("Error: " + error.message));
});

// --- BOTÓN ENTRAR ---
document.getElementById('btnLogin').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    // --- BOTÓN ENTRAR ---
document.getElementById('btnLogin').addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            console.log("Sesión iniciada, guardando persistencia...");
            // Esperamos 1.5 segundos para que la "llave" se guarde bien
            setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 1500);
        })
        .catch((error) => alert("Error al entrar: " + error.message));
});
});