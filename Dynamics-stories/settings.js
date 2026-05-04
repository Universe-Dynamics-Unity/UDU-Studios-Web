function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('active');
}

function borrarProgreso() {
    if(confirm("¿Estás seguro? Se borrarán todos tus capítulos guardados.")) {
        localStorage.clear();
        location.reload();
    }
}