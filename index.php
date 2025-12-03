<?php
// Backend opcional: puedes usar esto si en el futuro lees progreso del usuario
// include 'backend/usuario.php'; 
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seleccionar Juego | PWA Dislexia</title>

    <!-- Manifest -->
    <link rel="manifest" href="manifest.json">

    <!-- Estilos globales -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/juegos.css">

    <!-- Colores PWA -->
    <meta name="theme-color" content="#4a90e2">

    <!-- Iconos -->
    <link rel="icon" href="asset/iconos/icon-192.png" type="image/png">

</head>
<body>

    <header class="header">
        <h1>Elige un Juego</h1>
        <p class="descripcion">Refuerza tus habilidades de forma divertida</p>
    </header>

    <main class="contenedor-juegos">

        <!-- JUEGO 1 -->
        <div class="tarjeta-juego" onclick="location.href='vistas/juego1.html'">
            <img src="asset/imagenes/juego1.png" alt="Juego de Discriminación Visual" class="img-juego">
            <h2>Juego 1</h2>
            <p>Discriminación visual</p>
        </div>

        <!-- JUEGO 2 -->
        <div class="tarjeta-juego" onclick="location.href='vistas/juego2.html'">
            <img src="asset/imagenes/juego2.png" alt="Juego de Memoria Verbal" class="img-juego">
            <h2>Juego 2</h2>
            <p>Memoria verbal</p>
        </div>

        <!-- JUEGO 3 -->
        <div class="tarjeta-juego" onclick="location.href='vistas/juego3.html'">
            <img src="asset/imagenes/juego3.png" alt="Juego de Conciencia Fonológica" class="img-juego">
            <h2>Juego 3</h2>
            <p>Conciencia fonológica</p>
        </div>

    </main>

    <footer class="footer">
        <button class="btn-secundario" onclick="location.href='vistas/resultados.html'">
            Ver Progreso
        </button>
    </footer>

    <!-- Scripts globales -->
    <script src="js/util.js"></script>
    <script src="js/main.js"></script>
    <script src="js/pwa.js"></script>

    <!-- Registro del service worker (extra por seguridad) -->
    <script>
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("service-worker.js")
                .then(() => console.log("Service Worker activo"))
                .catch(err => console.error("Error al registrar SW", err));
        }
    </script>

</body>
</html>
