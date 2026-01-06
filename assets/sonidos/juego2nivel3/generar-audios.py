from gtts import gTTS

palabras = ["El perro cruzó rápido la carretera",
"La brisa movía las ramas del árbol",
"El barco partió al borde del muelle",
"El niño abrió la puerta despacio",
"La sombra cubría todo el suelo",
"El tren avanzó entre montañas frías",
"La lluvia golpeaba fuerte las ventanas",
"El zorro saltó sobre la cerca rota",
"La bruma escondía luces distantes",
"El dragón dormía dentro de la cueva",
"La bandera ondeaba sobre el edificio",
"El reloj marcaba tarde la hora",
"La piedra rodó por el sendero",
"El viento empujaba hojas secas",
"La sirena sonó cerca del puerto"]

for i, palabra in enumerate(palabras, start=1):
    tts = gTTS(text=palabra, lang="es")
    tts.save(f"audio_{i}.mp3")
