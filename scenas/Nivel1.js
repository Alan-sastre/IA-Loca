class Nivel1 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel1" });
    this.selectedNeuron = null;
    this.score = 0;
    this.connectionsCount = 0;
    this.maxConnections = 11; // 7 from Input->Hidden + 4 from Hidden->Output
    this.layer = "ENTRADA → OCULTA";
    this.nexaHealth = 10;
    this.weights = {
      "VISION-N1": 0.1,
      "AUDIO-N2": 0.1,
      "TACTO-N4": 0.1,
    };
    this.targetWeights = {
      "VISION-N1": 0.8,
      "AUDIO-N2": 0.6,
      "TACTO-N4": 0.9,
    };
    this.isWeightChallengeActive = false;
    this.completedConnections = [];
    this.neurons = {};
  }

  preload() {
    // Los sonidos se cargarán cuando los archivos estén disponibles en assets/sounds/
    // this.load.audio("error", "assets/sounds/error.mp3");
    // this.load.audio("success", "assets/sounds/success.mp3");
    // this.load.audio("win", "assets/sounds/win.mp3");
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    this.isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent,
    );

    const { width, height } = this.scale;

    // --- FONDO PROCEDURAL ---
    this.createBackground(width, height);

    // --- GRUPOS Y CAPAS ---
    this.connectionGraphics = this.add.graphics();
    this.tempConnectionGraphics = this.add.graphics();
    this.neuronGraphics = this.add.graphics();

    // --- INICIALIZAR NEURONAS ---
    this.setupNeurons(width, height);

    // --- HUD ---
    this.createHUD(width, height);

    // --- NEXA VISUALIZATION ---
    this.createNexaVisual(width, height);

    // --- INTRO MODAL ---
    this.showIntro();

    // --- INPUT ---
    this.input.on("pointermove", (pointer) => {
      if (this.selectedNeuron) {
        this.drawTempConnection(pointer);
      }
    });
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    // Gradiente fondo
    bg.fillGradientStyle(0x000510, 0x000510, 0x000a20, 0x000a20, 1);
    bg.fillRect(0, 0, width, height);

    // Estructuras geométricas lejanas
    const structures = this.add.graphics();
    structures.lineStyle(1, 0x00ffff, 0.1);
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(50, 150);
      this.drawPolygon(structures, x, y, size, Phaser.Math.Between(6, 8));
    }
    structures.setAlpha(0.4);

    // Partículas
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      const p = {
        x: Phaser.Math.Between(0, width),
        y: Phaser.Math.Between(0, height),
        speed: Phaser.Math.FloatBetween(0.2, 0.5),
        size: Phaser.Math.Between(1, 3),
      };
      this.particles.push(p);
    }
    this.particleGraphics = this.add.graphics();
  }

  drawPolygon(graphics, x, y, size, sides) {
    const step = (Math.PI * 2) / sides;
    graphics.beginPath();
    for (let i = 0; i <= sides; i++) {
      const px = x + size * Math.cos(i * step);
      const py = y + size * Math.sin(i * step);
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.closePath();
    graphics.strokePath();
  }

  setupNeurons(width, height) {
    const layers = {
      entrada: {
        x: 150,
        nodes: ["VISION", "AUDIO", "TACTO"],
        y: [125, 250, 375],
        desc: [
          "Percepción visual de NEXA",
          "Procesamiento de ondas sonoras",
          "Sensores hapticos externos",
        ],
      },
      oculta: {
        x: 500,
        nodes: ["N1", "N2", "N3", "N4"],
        y: [100, 200, 300, 400],
        desc: [
          "Procesador de patrones",
          "Analizador de frecuencias",
          "Integrador sensorial",
          "Lógica heurística",
        ],
      },
      salida: {
        x: 850,
        nodes: ["DECISION_A", "DECISION_B"],
        y: [175, 325],
        desc: ["Respuesta Proactiva", "Protocolo de Defensa"],
      },
    };

    Object.keys(layers).forEach((layerKey) => {
      const l = layers[layerKey];
      l.nodes.forEach((name, i) => {
        const neuron = {
          name: name,
          x: l.x,
          y: l.y[i],
          layer: layerKey,
          connected: false,
          radius: 35,
          description: l.desc[i],
        };
        this.neurons[name] = neuron;
        this.createNeuronInteractive(neuron);
      });
    });

    // Dibujar conexiones rotas iniciales
    this.drawBrokenConnections();
  }

  createNeuronInteractive(neuron) {
    const zone = this.add
      .zone(neuron.x, neuron.y, 80, 80)
      .setInteractive({ useHandCursor: true });
    neuron.zone = zone;

    zone.on("pointerdown", () => this.handleNeuronClick(neuron));
    zone.on("pointerover", () => this.showTooltip(neuron));
    zone.on("pointerout", () => this.hideTooltip());

    this.drawNeuron(neuron, "desconectada");

    // Etiqueta
    this.add
      .text(neuron.x, neuron.y + 45, neuron.name, {
        fontFamily: "Orbitron",
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0.5);
  }

  drawNeuron(neuron, state) {
    // We'll redraw all neurons in update or when state changes using neuronGraphics
  }

  handleNeuronClick(neuron) {
    if (this.isWeightChallengeActive) return;

    if (!this.selectedNeuron) {
      // Seleccionar origen
      this.selectedNeuron = neuron;
      this.playSound("success", { volume: 0.5, detune: 500 });
    } else {
      // Conectar con destino
      if (this.selectedNeuron === neuron) {
        this.selectedNeuron = null;
        return;
      }

      this.attemptConnection(this.selectedNeuron, neuron);
      this.selectedNeuron = null;
    }
  }

  playSound(key, config = {}) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
  }

  attemptConnection(origin, dest) {
    const validConnections = [
      // Entrada -> Oculta
      "VISION-N1",
      "VISION-N3",
      "AUDIO-N2",
      "AUDIO-N4",
      "TACTO-N1",
      "TACTO-N3",
      "TACTO-N4",
      // Oculta -> Salida
      "N1-DECISION_A",
      "N2-DECISION_A",
      "N2-DECISION_B",
      "N3-DECISION_B",
      "N4-DECISION_A",
    ];

    const traps = {
      "VISION-N2": "VISION no alimenta procesamiento auditivo",
      "AUDIO-N1": "Audio no conecta al procesador visual",
      "N3-DECISION_A": "Esa conexión crea un loop de retroalimentación",
      "N4-DECISION_B": "Genera conflicto de señales",
    };

    const connectionKey = `${origin.name}-${dest.name}`;

    // Ya conectada?
    if (this.completedConnections.includes(connectionKey)) return;

    if (validConnections.includes(connectionKey)) {
      this.onCorrectConnection(origin, dest, connectionKey);
    } else if (traps[connectionKey]) {
      this.onWrongConnection(origin, dest, traps[connectionKey]);
    } else {
      // Conexión no válida genérica (ej: conectar misma capa o saltar capas)
      this.onWrongConnection(
        origin,
        dest,
        "Conexión neuronal no válida en esta fase",
      );
    }
  }

  onCorrectConnection(origin, dest, key) {
    this.completedConnections.push(key);
    this.connectionsCount++;
    this.score += 60;
    this.playSound("success");

    this.updateHUD();
    this.checkLayerCompletion();

    // Pulso de energía
    this.createEnergyPulse(origin, dest);

    if (this.connectionsCount === 7) {
      this.layer = "OCULTA → SALIDA";
      this.updateHUD();
      this.pulseLayer("entrada");
      this.showMessage('NEXA: "...algo...empieza...a...tener...forma..."');
    }

    if (this.connectionsCount === 11) {
      this.layer = "AJUSTE DE PESOS";
      this.instructionText.setText(
        "OBJETIVO: AJUSTA LOS PESOS PARA ESTABILIZAR LA SEÑAL",
      );
      this.updateHUD();
      this.pulseLayer("oculta");
      this.showMessage('NEXA: "Puedo... percibir. Parcialmente. Continúa."');
      this.startWeightChallenge();
    }

    // Actualizar salud de NEXA (visual)
    this.nexaHealth = 10 + (this.connectionsCount / this.maxConnections) * 15;
    this.updateNexaHealthBar();
  }

  onWrongConnection(origin, dest, msg) {
    this.score = Math.max(0, this.score - 20);
    this.playSound("error");
    this.updateHUD();

    // Visual error (shake y línea roja)
    this.showErrorVisual(origin, dest);
    this.showMessage(msg, "#ff4444");
  }

  createEnergyPulse(origin, dest) {
    // Animación de puntos fluyendo
    const points = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const p = this.add.circle(origin.x, origin.y, 3, 0x00ff88);
      this.tweens.add({
        targets: p,
        x: dest.x,
        y: dest.y,
        duration: 1000,
        delay: i * 200,
        repeat: -1,
        ease: "Linear",
      });
      points.push(p);
    }
  }

  showErrorVisual(origin, dest) {
    const line = this.add.graphics();
    line.lineStyle(3, 0xff4444, 1);
    line.lineBetween(origin.x, origin.y, dest.x, dest.y);

    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 500,
      onComplete: () => line.destroy(),
    });

    // Camera shake
    this.cameras.main.shake(200, 0.005);
  }

  createHUD(width, height) {
    const style = { fontFamily: "Orbitron", fontSize: "14px", fill: "#00ffff" };
    this.add.text(20, 20, "ESTACIÓN: KRONOS-V | NÚCLEO: PERCEPCIÓN", style);

    this.scoreText = this.add
      .text(width - 20, 20, `SCORE: ${this.score}`, style)
      .setOrigin(1, 0);
    this.connText = this.add
      .text(width - 20, 40, `CONEXIONES: ${this.connectionsCount}/11`, style)
      .setOrigin(1, 0);

    this.layerText = this.add
      .text(width / 2, 20, `CAPA: ${this.layer}`, {
        ...style,
        fontSize: "18px",
      })
      .setOrigin(0.5, 0);

    // Instrucción persistente
    this.instructionText = this.add
      .text(width / 2, 50, "OBJETIVO: RECONSTRUYE LAS CONEXIONES NEURONALES", {
        fontFamily: "Rajdhani",
        fontSize: "16px",
        fill: "#ffffff",
        backgroundColor: "#00ffff22",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 0);

    // Animación de parpadeo suave para la instrucción
    this.tweens.add({
      targets: this.instructionText,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Barra salud NEXA
    this.add.text(20, height - 40, "ESTADO NEXA", style);
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x333333, 1);
    this.healthBarBg.fillRect(20, height - 20, 200, 10);

    this.healthBar = this.add.graphics();
    this.updateNexaHealthBar();
  }

  updateNexaHealthBar() {
    const height = this.scale.height;
    this.healthBar.clear();
    this.healthBar.fillStyle(0x00ffff, 1);
    this.healthBar.fillRect(20, height - 20, (this.nexaHealth / 100) * 200, 10);
  }

  createNexaVisual(width, height) {
    this.nexaContainer = this.add.container(width - 80, 80);
    this.nexaGraphics = this.add.graphics();
    this.nexaContainer.add(this.nexaGraphics);

    // Fragmentos (polígonos pequeños)
    this.nexaFragments = [];
    for (let i = 0; i < 12; i++) {
      const frag = {
        x: Phaser.Math.Between(-30, 30),
        y: Phaser.Math.Between(-30, 30),
        angle: Phaser.Math.Between(0, 360),
        size: Phaser.Math.Between(5, 15),
        dist: Phaser.Math.Between(40, 60),
      };
      this.nexaFragments.push(frag);
    }
  }

  startWeightChallenge() {
    this.isWeightChallengeActive = true;
    this.createSliders();
  }

  createSliders() {
    const sliderKeys = ["VISION-N1", "AUDIO-N2", "TACTO-N4"];
    this.sliders = [];

    sliderKeys.forEach((key, i) => {
      const y = 450;
      const x = 250 + i * 250;

      const label = this.add
        .text(x, y - 25, key, {
          fontFamily: "Rajdhani",
          fontSize: "12px",
          fill: "#ffffff",
        })
        .setOrigin(0.5);

      const track = this.add.graphics();
      track.lineStyle(2, 0x555555);
      track.lineBetween(x - 50, y, x + 50, y);

      const handle = this.add
        .circle(x - 50, y, 8, 0x00ffff)
        .setInteractive({ useHandCursor: true, draggable: true });

      handle.on("drag", (pointer, dragX) => {
        const minX = x - 50;
        const maxX = x + 50;
        handle.x = Phaser.Math.Clamp(dragX, minX, maxX);

        const value = (handle.x - minX) / 100; // 0 to 1
        this.weights[key] = parseFloat((0.1 + value * 0.9).toFixed(1));
        this.evaluateNetwork();
      });

      this.sliders.push({ handle, label, track, key });
    });

    // Output displays
    this.outputAText = this.add
      .text(850, 150, "DECISION_A: 0.0", {
        fontFamily: "Orbitron",
        fontSize: "12px",
        fill: "#00ffff",
      })
      .setOrigin(0.5);
    this.outputBText = this.add
      .text(850, 350, "DECISION_B: 0.0", {
        fontFamily: "Orbitron",
        fontSize: "12px",
        fill: "#00ffff",
      })
      .setOrigin(0.5);
  }

  evaluateNetwork() {
    // Cálculo simplificado
    // DECISION_A = (VISION->N1 * W1 + AUDIO->N2 * W2 + TACTO->N4 * W3) / 2
    // DECISION_B = (AUDIO->N2 * W2 + TACTO->N4 * W3) / 1.5

    const w1 = this.weights["VISION-N1"];
    const w2 = this.weights["AUDIO-N2"];
    const w3 = this.weights["TACTO-N4"];

    const outA = (w1 * 0.8 + w2 * 0.4 + w3 * 0.6) / 1.5;
    const outB = (w2 * 0.7 + w3 * 0.5) / 1.2;

    this.outputAText.setText(`DECISION_A: ${outA.toFixed(2)}`);
    this.outputBText.setText(`DECISION_B: ${outB.toFixed(2)}`);

    // Feedback visual
    this.outputAText.setFill(outA > 0.7 ? "#00ff88" : "#ff4444");
    this.outputBText.setFill(outB > 0.5 ? "#00ff88" : "#ff4444");

    if (outA > 0.7 && outB > 0.5) {
      this.onVictory();
    }
  }

  onVictory() {
    if (!this.isWeightChallengeActive) return; // Evitar múltiples ejecuciones
    this.isWeightChallengeActive = false;
    this.playSound("win");
    this.nexaHealth = 34;
    this.updateNexaHealthBar();

    this.instructionText.setText("¡NÚCLEO ESTABILIZADO!");
    this.instructionText.setFill("#00ff88");

    Swal.fire({
      title: "¡NÚCLEO ESTABILIZADO!",
      html: 'RUNA: "Núcleo de Percepción estabilizado."<br>BYTE: "NEXA puede ver y escuchar de nuevo. Aunque técnicamente nunca tuvo ojos. Pero ya sabes."',
      icon: "success",
      confirmButtonText: "CONTINUAR A LA SIGUIENTE FASE",
      allowOutsideClick: false,
      customClass: {
        popup: "custom-popup-class",
        title: "custom-title-class",
        confirmButton: "custom-confirm-button-class",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.scene.start("scenaVideo2");
      }
    });
  }

  update(time, delta) {
    const { width, height } = this.scale;

    // --- ANIMAR FONDO ---
    this.particleGraphics.clear();
    this.particleGraphics.fillStyle(0x00ffff, 0.5);
    this.particles.forEach((p) => {
      p.y -= p.speed;
      if (p.y < 0) p.y = height;
      this.particleGraphics.fillCircle(p.x, p.y, p.size);
    });

    // --- ANIMAR NEXA ---
    this.drawNexa(time);

    // --- DIBUJAR NEURONAS Y CONEXIONES ---
    this.drawNeuronsFrame(time);
    this.drawConnectionsFrame();
  }

  drawNexa(time) {
    this.nexaGraphics.clear();
    const isHealed = this.nexaHealth >= 34;
    const color = isHealed
      ? 0x00ffff
      : Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xff6644),
          Phaser.Display.Color.ValueToColor(0x00ffff),
          24,
          Math.min(24, this.connectionsCount * 2),
        ).color;

    // Esfera central (fragmentada o completa)
    if (isHealed) {
      this.nexaGraphics.lineStyle(2, color, 0.8);
      this.nexaGraphics.strokeCircle(0, 0, 30);
      this.nexaGraphics.fillStyle(color, 0.3);
      this.nexaGraphics.fillCircle(0, 0, 30);
    } else {
      // Dibujar fragmentos
      this.nexaFragments.forEach((f, i) => {
        const offset = Math.sin(time / 500 + i) * 5;
        const x = Math.cos(f.angle) * (f.dist + offset);
        const y = Math.sin(f.angle) * (f.dist + offset);

        this.nexaGraphics.lineStyle(1, color, 0.6);
        this.drawPolygon(this.nexaGraphics, x, y, f.size, 3 + (i % 3));
      });

      // Núcleo agrietado
      this.nexaGraphics.lineStyle(2, color, 0.4);
      this.nexaGraphics.strokeCircle(0, 0, 20);
    }
  }

  drawNeuronsFrame(time) {
    this.neuronGraphics.clear();

    Object.values(this.neurons).forEach((n) => {
      const isSelected = this.selectedNeuron === n;
      const isConnected = this.completedConnections.some((c) =>
        c.includes(n.name),
      );

      let color = 0x333344; // Desconectada
      let borderColor = 0x555566;
      let alpha = 0.6;

      if (isSelected) {
        color = 0x00ffff;
        borderColor = 0xffffff;
        alpha = 0.8;
      } else if (isConnected) {
        color = 0x00ffff;
        borderColor = 0x00ffff;
        alpha = 0.4;
      }

      // Capa exterior (borde)
      this.neuronGraphics.lineStyle(2, borderColor, 1);
      this.neuronGraphics.strokeCircle(n.x, n.y, n.radius);

      // Capa media (relleno)
      this.neuronGraphics.fillStyle(color, alpha);
      this.neuronGraphics.fillCircle(n.x, n.y, n.radius - 2);

      // Núcleo brillante
      const pulse = Math.sin(time / 200) * 2;
      this.neuronGraphics.fillStyle(0xffffff, 0.8);
      this.neuronGraphics.fillCircle(n.x, n.y, 5 + pulse);

      // Halo pulsante si está activa
      if (isConnected || isSelected) {
        this.neuronGraphics.lineStyle(
          1,
          0x00ffff,
          0.3 + Math.sin(time / 500) * 0.2,
        );
        this.neuronGraphics.strokeCircle(n.x, n.y, n.radius + 5 + pulse);
      }
    });
  }

  drawConnectionsFrame() {
    this.connectionGraphics.clear();

    // Conexiones correctas
    this.connectionGraphics.lineStyle(2, 0x00ff88, 1);
    this.completedConnections.forEach((key) => {
      const [originName, destName] = key.split("-");
      const origin = this.neurons[originName];
      const dest = this.neurons[destName];
      this.connectionGraphics.lineBetween(origin.x, origin.y, dest.x, dest.y);
    });
  }

  drawBrokenConnections() {
    // Dibujar líneas punteadas grises con rayo
    const broken = [
      ["VISION", "N1"],
      ["VISION", "N3"],
      ["AUDIO", "N2"],
      ["AUDIO", "N4"],
      ["TACTO", "N1"],
      ["TACTO", "N3"],
      ["TACTO", "N4"],
      ["N1", "DECISION_A"],
      ["N2", "DECISION_A"],
      ["N2", "DECISION_B"],
      ["N3", "DECISION_B"],
      ["N4", "DECISION_A"],
    ];

    const bg = this.add.graphics();
    bg.lineStyle(1, 0x555566, 0.5);

    broken.forEach(([o, d]) => {
      const origin = this.neurons[o];
      const dest = this.neurons[d];

      // Línea punteada (simulada con segmentos)
      const dist = Phaser.Math.Distance.Between(
        origin.x,
        origin.y,
        dest.x,
        dest.y,
      );
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        if (i % 2 === 0) {
          const x1 = Phaser.Math.Interpolation.Linear(
            [origin.x, dest.x],
            i / steps,
          );
          const y1 = Phaser.Math.Interpolation.Linear(
            [origin.y, dest.y],
            i / steps,
          );
          const x2 = Phaser.Math.Interpolation.Linear(
            [origin.x, dest.x],
            (i + 1) / steps,
          );
          const y2 = Phaser.Math.Interpolation.Linear(
            [origin.y, dest.y],
            (i + 1) / steps,
          );
          bg.lineBetween(x1, y1, x2, y2);
        }
      }

      // Rayo partido en el centro
      const midX = (origin.x + dest.x) / 2;
      const midY = (origin.y + dest.y) / 2;
      this.add
        .text(midX, midY, "⚡", { fontSize: "10px", alpha: 0.5 })
        .setOrigin(0.5);
    });
  }

  drawTempConnection(pointer) {
    this.tempConnectionGraphics.clear();
    this.tempConnectionGraphics.lineStyle(2, 0x00ffff, 0.5);
    this.tempConnectionGraphics.lineBetween(
      this.selectedNeuron.x,
      this.selectedNeuron.y,
      pointer.x,
      pointer.y,
    );
  }

  showIntro() {
    Swal.fire({
      title: "NÚCLEO DE PERCEPCIÓN",
      html: `
        <div style="text-align: left;">
          <p><strong>RUNA:</strong> "Núcleo de Percepción alcanzado. Las conexiones neuronales están rotas. Reconstruye la red."</p>
          <p><strong>NEXA:</strong> "...v1s10n...s1n...s3ñal...n0...puedo...v3r..."</p>
          <p><strong>BYTE:</strong> "NEXA intenta comunicarse pero sus neuronas no están conectadas. Conecta primero la capa de entrada a la capa oculta, luego la oculta a la salida."</p>
        </div>
      `,
      confirmButtonText: "INICIAR RECONSTRUCCIÓN",
      customClass: {
        popup: "custom-popup-class",
        title: "custom-title-class",
        confirmButton: "custom-confirm-button-class",
      },
    });
  }

  showMessage(msg, color = "#ffffff") {
    if (this.msgText) this.msgText.destroy();

    this.msgText = this.add
      .text(this.scale.width / 2, 400, msg, {
        fontFamily: "Rajdhani",
        fontSize: "18px",
        fill: color,
        backgroundColor: "#000000aa",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      if (this.msgText) this.msgText.destroy();
    });
  }

  showTooltip(neuron) {
    this.tooltip = this.add.container(neuron.x, neuron.y - 60);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(1, 0x00ffff, 1);
    bg.fillRoundedRect(-75, -20, 150, 40, 5);
    bg.strokeRoundedRect(-75, -20, 150, 40, 5);

    const txt = this.add
      .text(0, 0, neuron.description, {
        fontFamily: "Rajdhani",
        fontSize: "10px",
        fill: "#ffffff",
        wordWrap: { width: 140 },
        align: "center",
      })
      .setOrigin(0.5);

    this.tooltip.add([bg, txt]);
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.destroy();
  }

  updateHUD() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.connText.setText(`CONEXIONES: ${this.connectionsCount}/11`);
    this.layerText.setText(`CAPA: ${this.layer}`);
  }

  pulseLayer(layerKey) {
    Object.values(this.neurons).forEach((n) => {
      if (n.layer === layerKey) {
        this.tweens.add({
          targets: n.zone, // We use the zone as a target just for the logic, we'll use n.radius if we wanted to animate it
          scale: 1.2,
          duration: 200,
          yoyo: true,
          repeat: 2,
        });
      }
    });
  }

  checkLayerCompletion() {
    // Logic for layer completion pulses is handled in onCorrectConnection
  }
}

window.Nivel1 = Nivel1;
