from gtts import gTTS

palabras = ["cama",
"cana",
"caba",
"pato",
"palo",
"pata",
"lata",
"laca",
"lapa"]

for palabra in palabras:
    tts = gTTS(text=palabra, lang="es")
    tts.save(f"{palabra}.mp3")
