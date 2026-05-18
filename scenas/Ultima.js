class Ultima extends Phaser.Scene {
  constructor() {
    super({ key: "Ultima" });
    this.currentStep = 0;
    this.totalSteps = 4;
    this.feedbackElements = [];
  }

  preload() {
    // Cargar la música de fondo
    
    
    // Cargar recursos necesarios
    this.load.image("ultimaa", "assets/Ultima/Ultimaa.jpg");
  }

  create() {
    // Configurar la música de fondo
    this.musicManager = MusicManager.getInstance();
    if (!this.musicManager.isPlaying()) {
      if (this.cache.audio.exists('backgroundMusic')) {
        const backgroundMusic = this.sound.add('backgroundMusic');
        this.musicManager.setMusic(backgroundMusic);
        this.musicManager.playMusic();
      }
    }
    
    // Agregar la imagen de fondo
    const background = this.add.image(0, 0, "ultimaa");
    background.setOrigin(0, 0);
    background.setDisplaySize(this.scale.width, this.scale.height);

    // Calcular dimensiones adaptativas
    const isMobile = this.scale.width < 768;
    const titleSize = isMobile ? 36 : 48;
    const messageSize = isMobile ? 24 : 32;

    // Título principal con estilo profesional
    const title = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 50, "¡Felicidades!", {
        font: `bold ${titleSize}px Arial`,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Mensaje de éxito
    const successMessage = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 20,
        "Has completado exitosamente el nivel",
        {
          font: `bold ${messageSize}px Arial`,
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setAlpha(0);

    // Animación de entrada del título
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: this.scale.height / 2 - 70,
      duration: 1000,
      ease: "Power2",
    });

    // Animación de entrada del mensaje
    this.tweens.add({
      targets: successMessage,
      alpha: 1,
      y: this.scale.height / 2,
      duration: 1000,
      delay: 500,
      ease: "Power2",
    });

    // Ajustar la escala si es necesario
    if (isMobile) {
      const scale = Math.min(this.scale.width / 800, this.scale.height / 600);
      title.setScale(scale);
      successMessage.setScale(scale);
    }
  }

  update() {
    // Actualizar lógica si es necesario
  }
}

window.Ultima = Ultima;
