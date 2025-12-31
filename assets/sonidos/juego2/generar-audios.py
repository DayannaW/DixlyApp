from gtts import gTTS

palabras = ["pedro"]

for palabra in palabras:
    tts = gTTS(text=palabra, lang="es")
    tts.save(f"{palabra}.mp3")
