class Nivel2 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel2" });
    this.score = 0;
    this.nexaHealth = 34;
    this.isLevelComplete = false;
    
    // Parámetros de la onda del jugador
    this.playerWave = {
      amplitude: 20,
      frequency: 0.01,
      phase: 0
    };
    
    // Parámetros de la onda objetivo
    this.targetWave = {
      amplitude: 60,
      frequency: 0.03,
      phase: Math.PI / 2
    };

    this.similarity = 0;
    this.syncThreshold = 95; // 95% de similitud para ganar
  }

  preload() {
    // Los sonidos se cargarán cuando los archivos estén disponibles
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    const { width, height } = this.scale;

    // --- FONDO PROCEDURAL ---
    this.createBackground(width, height);

    // --- GRÁFICOS DE ONDAS ---
    this.waveGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();
    
    // --- HUD ---
    this.createHUD(width, height);

    // --- NEXA VISUALIZATION ---
    this.createNexaVisual(width, height);

    // --- CONTROLES (SLIDERS) ---
    this.createControls(width, height);

    // --- INTRO MODAL ---
    this.showIntro();
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000510, 0x000510, 0x000815, 0x000815, 1);
    bg.fillRect(0, 0, width, height);

    // Rejilla de osciloscopio
    bg.lineStyle(1, 0x00ffff, 0.1);
    for (let i = 0; i < width; i += 50) {
      bg.lineBetween(i, 0, i, height);
    }
    for (let j = 0; j < height; j += 50) {
      bg.lineBetween(0, j, width, j);
    }

    // Línea central (Eje X)
    bg.lineStyle(2, 0x00ffff, 0.3);
    bg.lineBetween(0, 200, width, 200);
  }

  createControls(width, height) {
    const sliderWidth = 200;
    const startX = width / 2 - 320;
    const y = 420;

    const controls = [
      { key: 'amplitude', label: 'AMPLITUD', min: 10, max: 100, color: 0x00ffff },
      { key: 'frequency', label: 'FRECUENCIA', min: 0.005, max: 0.08, color: 0x00ff88 },
      { key: 'phase', label: 'FASE', min: 0, max: Math.PI * 2, color: 0xbf00ff }
    ];

    this.sliders = [];

    controls.forEach((ctrl, i) => {
      const posX = startX + i * 250;
      
      // Etiqueta
      this.add.text(posX, y - 40, ctrl.label, {
        fontFamily: "Orbitron",
        fontSize: "12px",
        fill: "#ffffff"
      }).setOrigin(0.5);

      // Fondo del slider
      const track = this.add.graphics();
      track.lineStyle(4, 0x333333, 1);
      track.lineBetween(posX - 100, y, posX + 100, y);
      
      // Botón del slider
      const handle = this.add.circle(posX, y, 12, ctrl.color).setInteractive({ useHandCursor: true, draggable: true });
      
      // Inicializar posición del handle según valor actual
      const range = ctrl.max - ctrl.min;
      const initialPercent = (this.playerWave[ctrl.key] - ctrl.min) / range;
      handle.x = (posX - 100) + (initialPercent * 200);

      handle.on('drag', (pointer, dragX) => {
        const minX = posX - 100;
        const maxX = posX + 100;
        handle.x = Phaser.Math.Clamp(dragX, minX, maxX);
        
        const percent = (handle.x - minX) / 200;
        this.playerWave[ctrl.key] = ctrl.min + (percent * range);
        this.calculateSimilarity();
      });

      this.sliders.push({ handle, ...ctrl });
    });
  }

  calculateSimilarity() {
    // Cálculo de similitud basado en la diferencia de los parámetros
    const diffAmp = Math.abs(this.playerWave.amplitude - this.targetWave.amplitude) / 100;
    const diffFreq = Math.abs(this.playerWave.frequency - this.targetWave.frequency) / 0.08;
    const diffPhase = Math.abs(this.playerWave.phase - this.targetWave.phase) / (Math.PI * 2);

    const totalDiff = (diffAmp + diffFreq + diffPhase) / 3;
    this.similarity = Math.max(0, Math.floor((1 - totalDiff) * 100));

    this.syncText.setText(`SINCRONÍA: ${this.similarity}%`);
    this.syncText.setFill(this.similarity > 80 ? "#00ff88" : (this.similarity > 50 ? "#ffff00" : "#ff4444"));

    if (this.similarity >= this.syncThreshold && !this.isLevelComplete) {
      this.onVictory();
    }
  }

  update(time, delta) {
    if (this.isLevelComplete) return;

    this.waveGraphics.clear();
    const { width } = this.scale;
    const centerY = 200;

    // --- DIBUJAR ONDA OBJETIVO (Línea sólida amarillo muy brillante) ---
    this.waveGraphics.lineStyle(3, 0xffff00, 0.8);
    this.waveGraphics.beginPath();
    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin(x * this.targetWave.frequency + this.targetWave.phase + time * 0.002) * this.targetWave.amplitude;
      if (x === 0) this.waveGraphics.moveTo(x, y);
      else this.waveGraphics.lineTo(x, y);
    }
    this.waveGraphics.strokePath();

    // --- DIBUJAR ONDA DEL JUGADOR (Línea sólida magenta muy brillante) ---
    const waveColor = 0xff00ff; // Magenta vibrante fijo para máxima visibilidad

    // Capa de brillo exterior
    this.waveGraphics.lineStyle(8, waveColor, 0.4);
    this.waveGraphics.beginPath();
    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin(x * this.playerWave.frequency + this.playerWave.phase + time * 0.002) * this.playerWave.amplitude;
      if (x === 0) this.waveGraphics.moveTo(x, y);
      else this.waveGraphics.lineTo(x, y);
    }
    this.waveGraphics.strokePath();

    // Capa central blanca (núcleo de luz)
    this.waveGraphics.lineStyle(4, 0xffffff, 1);
    this.waveGraphics.strokePath();

    // Línea de color principal
    this.waveGraphics.lineStyle(3, waveColor, 1);
    this.waveGraphics.strokePath();
  }

  onVictory() {
    this.isLevelComplete = true;
    this.playSound("win");
    this.nexaHealth = 67;
    this.updateNexaHealthBar();
    this.score += 500;
    this.updateHUD();

    // Animación de sincronía perfecta
    this.tweens.add({
      targets: this.playerWave,
      amplitude: this.targetWave.amplitude,
      frequency: this.targetWave.frequency,
      phase: this.targetWave.phase,
      duration: 1000,
      ease: 'Power2'
    });

    this.showMessage("¡Sincronización de Frecuencia Exitosa!", "#00ff88");

    this.time.delayedCall(2000, () => {
      Swal.fire({
        title: "¡NÚCLEO DE COMUNICACIÓN ESTABILIZADO!",
        html: `
          <div style="text-align: left;">
            <p><strong>RUNA:</strong> "La señal es clara. NEXA ha recuperado su voz modulada."</p>
            <p><strong>NEXA:</strong> "Puedo... comunicarme... correctamente. La estática... ha... desaparecido. Gracias."</p>
            <p><strong>BYTE:</strong> "¡Increíble! Pensé que te quedarías escuchando ruido blanco para siempre. ¡Solo falta un núcleo!"</p>
          </div>
        `,
        confirmButtonText: "CONTINUAR AL NÚCLEO FINAL",
        allowOutsideClick: false,
        customClass: {
          popup: "custom-popup-class",
          title: "custom-title-class",
          confirmButton: "custom-confirm-button-class"
        }
      }).then(() => {
        this.scene.start("Nivel3");
      });
    });
  }

  createHUD(width, height) {
    const style = { fontFamily: "Orbitron", fontSize: "14px", fill: "#00ffff" };
    this.add.text(20, 20, "ESTACIÓN: KRONOS-V | NÚCLEO: COMUNICACIÓN", style);
    
    this.scoreText = this.add.text(width - 20, 20, `SCORE: ${this.score}`, style).setOrigin(1, 0);
    
    this.syncText = this.add.text(width / 2, 80, "SINCRONÍA: 0%", {
      fontFamily: "Orbitron",
      fontSize: "24px",
      fill: "#ff4444"
    }).setOrigin(0.5);

    this.instructionText = this.add.text(width / 2, 50, "OBJETIVO: SINCRONIZA TU ONDA CON LA SEÑAL DE NEXA", {
      fontFamily: "Rajdhani",
      fontSize: "16px",
      fill: "#ffffff",
      backgroundColor: "#00ffff22",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0);

    // Barra salud NEXA
    this.add.text(20, height - 40, "ESTADO NEXA", style);
    this.healthBarBg = this.add.graphics().fillStyle(0x333333, 1).fillRect(20, height - 20, 200, 10);
    this.healthBar = this.add.graphics();
    this.updateNexaHealthBar();
  }

  updateNexaHealthBar() {
    const height = this.scale.height;
    this.healthBar.clear().fillStyle(0x00ffff, 1).fillRect(20, height - 20, (this.nexaHealth / 100) * 200, 10);
  }

  createNexaVisual(width, height) {
    this.nexaContainer = this.add.container(width - 80, 80);
    this.nexaGraphics = this.add.graphics();
    this.nexaContainer.add(this.nexaGraphics);
  }

  updateHUD() {
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  showMessage(msg, color = "#ffffff") {
    if (this.msgText) this.msgText.destroy();
    this.msgText = this.add.text(this.scale.width / 2, 350, msg, {
      fontFamily: "Rajdhani",
      fontSize: "18px",
      fill: color,
      backgroundColor: "#000000aa",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    this.time.delayedCall(3000, () => { if (this.msgText) this.msgText.destroy(); });
  }

  playSound(key, config = {}) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
  }

  showIntro() {
    Swal.fire({
      title: "NÚCLEO DE COMUNICACIÓN",
      html: `
        <div style="text-align: left;">
          <p><strong>RUNA:</strong> "El módulo de comunicación de NEXA está emitiendo interferencia pura."</p>
          <p><strong>NEXA:</strong> "Sshhh... krzzz... mmm... s1n... v0z..."</p>
          <p><strong>BYTE:</strong> "Necesitas ajustar la frecuencia, amplitud y fase de su señal para que coincida con el patrón base. ¡Si no lo haces, nunca entenderemos sus protocolos!"</p>
        </div>
      `,
      confirmButtonText: "INICIAR SINCRONIZACIÓN",
      customClass: { popup: "custom-popup-class", title: "custom-title-class", confirmButton: "custom-confirm-button-class" }
    });
  }
}

window.Nivel2 = Nivel2;
