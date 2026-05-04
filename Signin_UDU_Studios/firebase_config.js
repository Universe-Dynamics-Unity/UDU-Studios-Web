import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    // Pega aquí tus llaves de la imagen image_8847bb.png
    apiKey: "AIzaSyD7eJ-OnytMCuJjzry108SSMvsvsx_N1NE",
    authDomain: "udu-studios-global.firebaseapp.com",
    projectId: "udu-studios-global",
    storageBucket: "udu-studios-global.firebasestorage.app",
    messagingSenderId: "229264187536",
    appId: "1:229264187536:web:ac811838ac60785f8ff815",
    measurementId: "G-S2XCWVFZH8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ESTA LÍNEA ES EL PUENTE: Obliga a recordar al usuario en el navegador
setPersistence(auth, browserLocalPersistence)
  .catch((error) => console.error("Error de persistencia:", error));

// Esto permite que main.js use la conexión
export { auth, db };