class scenaVideo4 extends Phaser.Scene {
  constructor() {
    super({ key: "scenaVideo4" });
  }

  preload() {
    // Cargar el video
    this.load.video("video4", "assets/video4/Final.mp4", "loadeddata");

    // Agregar manejo de errores para la carga del video
    this.load.on("loaderror", (file) => {
      if (file.key === "video4") {
        console.error("Error al cargar el video:", file.url);
        // Cambiar a la escena final si el video no se puede cargar
        this.scene.start("Ultima");
      }
    });
  }

  create() {
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    // Configurar la música de fondo
    this.musicManager = MusicManager.getInstance();
    if (!this.musicManager.isPlaying()) {
      if (this.cache.audio.exists("backgroundMusic")) {
        const backgroundMusic = this.sound.add("backgroundMusic");
        this.musicManager.setMusic(backgroundMusic);
        this.musicManager.playMusic();
      }
    }

    // Pausar la música usando el AudioManager
    const audioManager = this.scene.get("AudioManager");
    if (audioManager) {
      audioManager.pauseMusic();
    }

    this.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      0x000000,
    );

    const video = this.add.video(screenWidth / 2, screenHeight / 2, "video4");

    // Verificar que el video se haya cargado correctamente
    if (!video) {
      console.error("Error: Video no se pudo cargar correctamente");
      this.scene.start("Ultima");
      return;
    }

    // Esperar a que el video esté listo antes de acceder a sus propiedades
    let retryCount = 0;
    const maxRetries = 50;

    const checkVideoReady = () => {
      if (video.video) {
        const videoElement = video.video;
        videoElement.muted = false;
        videoElement.volume = 1;

        setupVideoControls();
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error("Error: Video no se pudo cargar después de múltiples intentos");
          this.scene.start("Ultima");
          return;
        }
        setTimeout(checkVideoReady, 100);
      }
    };

    const setupVideoControls = () => {
      const videoElement = video.video;

      video.on("play", () => {
        if (videoElement) {
          const videoWidth = videoElement.videoWidth;
          const videoHeight = videoElement.videoHeight;

          if (videoWidth && videoHeight) {
            const videoAspectRatio = videoWidth / videoHeight;
            const screenAspectRatio = screenWidth / screenHeight;

            if (videoAspectRatio > screenAspectRatio) {
              video.setDisplaySize(screenWidth, screenWidth / videoAspectRatio);
            } else {
              video.setDisplaySize(screenHeight * videoAspectRatio, screenHeight);
            }
          }
        }
      });

      video.play();

      // --- Barra de volumen interactiva ---
      const sliderContainer = document.createElement("div");
      sliderContainer.style.position = "absolute";
      sliderContainer.style.right = "20px";
      sliderContainer.style.top = "50%";
      sliderContainer.style.transform = "translateY(-50%)";
      sliderContainer.style.zIndex = 1000;
      sliderContainer.style.background = "rgba(30,30,30,0.85)";
      sliderContainer.style.borderRadius = "16px";
      sliderContainer.style.padding = "20px 15px";
      sliderContainer.style.display = "flex";
      sliderContainer.style.flexDirection = "column";
      sliderContainer.style.alignItems = "center";
      sliderContainer.style.justifyContent = "space-between";
      sliderContainer.style.width = "50px";
      sliderContainer.style.height = "220px";
      sliderContainer.style.boxShadow = "0 4px 16px rgba(0,0,0,0.35)";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = 0;
      slider.max = 100;
      slider.value = 100;
      slider.style.webkitAppearance = "slider-vertical";
      slider.style.writingMode = "vertical-lr";
      slider.style.transform = "rotate(180deg)";
      slider.style.width = "8px";
      slider.style.height = "150px";
      slider.style.accentColor = "#1abc9c";
      slider.title = "Volumen general";
      sliderContainer.appendChild(slider);

      const valueLabel = document.createElement("span");
      valueLabel.innerText = "100";
      valueLabel.style.fontSize = "1.2em";
      valueLabel.style.color = "#1abc9c";
      valueLabel.style.fontWeight = "bold";
      sliderContainer.appendChild(valueLabel);

      document.body.appendChild(sliderContainer);

      slider.addEventListener("input", () => {
        const vol = slider.value / 100;
        if (videoElement) {
          videoElement.volume = vol;
          videoElement.muted = vol === 0;
        }
        valueLabel.innerText = slider.value;
        if (this.musicManager && this.musicManager.music) {
          this.musicManager.music.setVolume(vol * 0.15);
        }
      });

      video.on("complete", () => {
        if (audioManager) {
          audioManager.resumeMusic();
        }
        if (sliderContainer && sliderContainer.parentNode) {
          sliderContainer.parentNode.removeChild(sliderContainer);
        }
        this.scene.start("Ultima");
      });
    };

    checkVideoReady();
  }
}

window.scenaVideo4 = scenaVideo4;
