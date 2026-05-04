// Función para cambiar de pantalla después de 3 segundos
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loader = document.getElementById('loader');
                const mainContent = document.getElementById('main-content');

                // Desvanecer el loader
                loader.style.opacity = '0';
                
                setTimeout(() => {
                    loader.style.display = 'none';
                    // Mostrar el contenido con animación
                    mainContent.style.display = 'flex';
                    setTimeout(() => {
                        mainContent.style.opacity = '1';
                    }, 50);
                    // Permitir scroll si fuera necesario
                    document.body.style.overflow = 'auto';
                }, 500); // Tiempo del fade out
                
            }, 3000); // 3000ms = 3 segundos
        });