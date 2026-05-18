class scenaPrincipal extends Phaser.Scene {
  constructor() {
    super({ key: "scenaPrincipal" });
    this.musicManager = MusicManager.getInstance();
    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent,
    );
  }

  preload() {
    this.load.image("background", "assets/scenaPrincipal/1.jpg");
  }

  create() {
    // Obtén las dimensiones de la pantalla
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    // Añade la imagen de fondo
    const background = this.add.image(0, 0, "background");

    // Escala la imagen para que cubra toda la pantalla manteniendo la proporción
    const scaleX = screenWidth / background.width;
    const scaleY = screenHeight / background.height;
    const scale = Math.max(scaleX, scaleY); // Usar el mayor de los dos para asegurar cobertura completa
    background.setScale(scale);

    // Centra la imagen en la pantalla
    background.setPosition(screenWidth / 2, screenHeight / 2);

    // Ajustar el tamaño del texto según si es móvil o no
    const fontSize = this.isMobile ? "32px" : "24px";
    const textY = this.isMobile ? screenHeight - 120 : screenHeight - 90;

    // Añade el texto en la parte inferior
    const text = this.add
      .text(screenWidth / 2, textY, "Dale espacio o click para continuar", {
        font: `${fontSize} Arial`,
        fill: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000",
          blur: 2,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5);

    // Crear un tween para hacer parpadear el texto
    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Reproducir la música usando el gestor de música si existe
    if (this.cache.audio.exists("musica")) {
      const musica = this.sound.add("musica");
      this.musicManager.setMusic(musica);
      this.musicManager.playMusic();
    }

    // Escuchar la tecla espacio
    this.input.keyboard.on("keydown-SPACE", () => {
      this.cambiarEscena();
    });

    // Escuchar clic del mouse/touch
    this.input.on("pointerdown", () => {
      this.cambiarEscena();
    });

    // Añadir mensaje de orientación para móviles
    if (this.isMobile) {
      this.checkOrientation();
      const boundCheck = this.checkOrientation.bind(this);
      window.addEventListener("resize", boundCheck);
      this.events.on("shutdown", () => {
        window.removeEventListener("resize", boundCheck);
      });
    }
  }

  checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    // Si ya existe un mensaje de orientación, lo eliminamos
    if (this.orientationText) {
      this.orientationText.destroy();
    }

    // Si no está en modo horizontal, mostrar mensaje
    if (!isLandscape) {
      this.orientationText = this.add
        .text(
          screenWidth / 2,
          screenHeight / 2,
          "Por favor, gira tu dispositivo a modo horizontal",
          {
            font: "24px Arial",
            fill: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 4,
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 },
          },
        )
        .setOrigin(0.5, 0.5)
        .setDepth(1000);
    }
  }

  cambiarEscena() {
    // Solo permitir cambiar de escena si estamos en modo horizontal en móviles
    if (this.isMobile && window.innerWidth <= window.innerHeight) {
      return;
    }
    this.scene.start("scenaVideo1");
  }

  update() {
    // No es necesario actualizar nada en cada frame
  }
}

window.scenaPrincipal = scenaPrincipal;
