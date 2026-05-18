function isMobile() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

var config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game",
    width: 1000,
    height: 500,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  audio: {
    disableWebAudio: false,
    context: false,
    noAudio: false,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    willReadFrequently: true,
  },
  scene: [
    scenaPrincipal,
    scenaVideo1,
    Nivel1,
    scenaVideo2,
    Nivel2,
    Nivel3,
    scenaVideo4,
    Ultima,
  ],
};

// Crear el contenedor del juego
const gameContainer = document.createElement("div");
gameContainer.id = "game";
document.body.appendChild(gameContainer);

// Crear el juego
var game = new Phaser.Game(config);

// Manejar la orientación en móviles
if (isMobile()) {
  window.addEventListener("resize", function () {
    if (window.innerHeight > window.innerWidth) {
      document.getElementById("turn").style.display = "flex";
    } else {
      document.getElementById("turn").style.display = "none";
    }
  });
}
