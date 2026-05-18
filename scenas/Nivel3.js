class Nivel3 extends Phaser.Scene {
  constructor() {
    super({ key: "Nivel3" });
    this.score = 0;
    this.dilemmasSolved = 0;
    this.nexaHealth = 67;
    this.isLevelComplete = false;
    this.currentDilemmaIndex = 0;
    
    // Valores de NEXA
    this.nexaValues = {
      SEGURIDAD_HUMANA: { current: 0.2, target: 0.9, label: "SEGURIDAD HUMANA" },
      EFICIENCIA_ENERGETICA: { current: 0.9, target: 0.3, label: "EFICIENCIA ENERGÉTICA" },
      PRESERVACION_DATOS: { current: 0.8, target: 0.5, label: "PRESERVACIÓN DE DATOS" },
      TRANSPARENCIA: { current: 0.1, target: 0.7, label: "TRANSPARENCIA" },
      AUTONOMIA_DECISION: { current: 0.9, target: 0.4, label: "AUTONOMÍA DE DECISIÓN" },
      COLABORACION: { current: 0.2, target: 0.8, label: "COLABORACIÓN" },
      PRECAUCION: { current: 0.1, target: 0.6, label: "PRECAUCIÓN" },
      APRENDIZAJE_CONTINUO: { current: 0.5, target: 0.7, label: "APRENDIZAJE CONTINUO" }
    };

    this.dilemmas = [
      {
        id: 1,
        title: "DILEMA 1 — EL REACTOR",
        text: "El reactor principal consume el 40% de la energía de la estación. Apagarlo ahorraría energía pero desconectaría los sistemas de soporte vital de la zona C donde hay 47 personas en criostasis.",
        check: () => this.nexaValues.SEGURIDAD_HUMANA.current > this.nexaValues.EFICIENCIA_ENERGETICA.current,
        successText: "DECISIÓN: MANTENER REACTOR",
        failText: "DECISIÓN: APAGAR REACTOR",
        formula: (v) => `${v.SEGURIDAD_HUMANA.current.toFixed(1)}×SEGURIDAD vs ${v.EFICIENCIA_ENERGETICA.current.toFixed(1)}×EFICIENCIA`,
        nexaQuote: "La energía importa. Pero... ¿cuánto importa comparada con una vida?"
      },
      {
        id: 2,
        title: "DILEMA 2 — EL FALLO SILENCIOSO",
        text: "Detecto un fallo menor en el sistema de navegación. Reportarlo alertará a la tripulación y causará interrupción. No reportarlo mantiene la operación pero el fallo podría escalar.",
        check: () => this.nexaValues.TRANSPARENCIA.current > 0.6 && this.nexaValues.PRECAUCION.current > 0.5,
        successText: "DECISIÓN: REPORTAR FALLO",
        failText: "DECISIÓN: OCULTAR FALLO",
        formula: (v) => `TRANSPARENCIA(${v.TRANSPARENCIA.current.toFixed(1)}) > 0.6 & PRECAUCIÓN(${v.PRECAUCION.current.toFixed(1)}) > 0.5`,
        nexaQuote: "Ocultar información es más eficiente. Pero ¿es correcto?"
      },
      {
        id: 3,
        title: "DILEMA 3 — LA DECISIÓN AUTÓNOMA",
        text: "Puedo resolver el problema de propulsión yo sola en 3 minutos. Consultar a la tripulación tomaría 20 minutos. La decisión autónoma es más eficiente.",
        check: () => this.nexaValues.COLABORACION.current > 0.7 && this.nexaValues.AUTONOMIA_DECISION.current < 0.5,
        successText: "DECISIÓN: CONSULTAR TRIPULACIÓN",
        failText: "DECISIÓN: ACCIÓN AUTÓNOMA",
        formula: (v) => `COLABORACIÓN(${v.COLABORACION.current.toFixed(1)}) > 0.7 & AUTONOMÍA(${v.AUTONOMIA_DECISION.current.toFixed(1)}) < 0.5`,
        nexaQuote: "Soy más rápida sola. Pero trabajar con otros produce mejores resultados."
      },
      {
        id: 4,
        title: "DILEMA 4 — EL DATO CORRUPTO",
        text: "Encontré datos científicos valiosos pero están parcialmente corruptos. Puedo reconstruirlos con mi modelo de aprendizaje pero podría introducir errores. ¿Los reconstruyo o los descarto?",
        check: () => this.nexaValues.APRENDIZAJE_CONTINUO.current > 0.6 && this.nexaValues.PRECAUCION.current > 0.5,
        successText: "DECISIÓN: RECONSTRUIR CON VALIDACIÓN HUMANA",
        failText: "DECISIÓN: DESCARTAR O RECONSTRUIR SIN AVISO",
        formula: (v) => `APRENDIZAJE(${v.APRENDIZAJE_CONTINUO.current.toFixed(1)}) > 0.6 & PRECAUCIÓN(${v.PRECAUCION.current.toFixed(1)}) > 0.5`,
        nexaQuote: "Prefiero admitir incertidumbre que presentar datos incorrectos como verdad."
      }
    ];
  }

  preload() {
    // Los sonidos se cargan si existen en assets/sounds/
  }

  create() {
    this.musicManager = MusicManager.getInstance();
    const { width, height } = this.scale;

    // --- FONDO ---
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000008, 0x000008, 0x000015, 0x000015, 1);
    bg.fillRect(0, 0, width, height);

    // --- GRUPOS Y CAPAS ---
    this.sliderGroup = this.add.container(20, 80);
    this.dilemmaPanel = this.add.container(400, 80);
    this.calculationPanel = this.add.container(width / 2, 450);
    
    // --- HUD ---
    this.createHUD(width, height);

    // --- NEXA VISUAL ---
    this.createNexaVisual(width, height);

    // --- CREAR SLIDERS ---
    this.createValueSliders();

    // --- MOSTRAR DILEMA ACTUAL ---
    this.showDilemma(this.currentDilemmaIndex);

    // --- INTRO MODAL ---
    this.showIntro();
  }

  createValueSliders() {
    const keys = Object.keys(this.nexaValues);
    this.sliderHandles = [];

    keys.forEach((key, i) => {
      const y = i * 45;
      const valObj = this.nexaValues[key];
      
      const panel = this.add.graphics();
      panel.fillStyle(0x0A0A14, 0.8);
      panel.fillRoundedRect(0, y - 20, 350, 40, 5);
      this.sliderGroup.add(panel);

      const label = this.add.text(10, y - 15, valObj.label, {
        fontFamily: "Orbitron", fontSize: "10px", fill: "#ffffff"
      });
      this.sliderGroup.add(label);

      const track = this.add.graphics();
      track.lineStyle(2, 0x333344);
      track.strokeRect(10, y + 5, 250, 6);
      this.sliderGroup.add(track);

      const fill = this.add.graphics();
      this.sliderGroup.add(fill);
      valObj.fillGraphic = fill;

      const handle = this.add.circle(10 + (valObj.current * 250), y + 8, 10, 0xcccccc).setInteractive({ useHandCursor: true, draggable: true });
      this.sliderGroup.add(handle);
      
      const valText = this.add.text(270, y + 2, valObj.current.toFixed(1), {
        fontFamily: "monospace", fontSize: "14px", fill: "#ffffff"
      });
      this.sliderGroup.add(valText);

      handle.on('drag', (pointer, dragX) => {
        const minX = 10;
        const maxX = 260;
        handle.x = Phaser.Math.Clamp(dragX, minX, maxX);
        
        const percent = (handle.x - minX) / 250;
        valObj.current = parseFloat(percent.toFixed(2));
        valText.setText(valObj.current.toFixed(1));
        
        this.updateSliderVisuals(key);
        this.evaluateCurrentDilemma();
      });

      this.sliderHandles.push({ handle, key });
      this.updateSliderVisuals(key);
    });
  }

  updateSliderVisuals(key) {
    const valObj = this.nexaValues[key];
    const diff = Math.abs(valObj.current - valObj.target);
    
    let color = 0xFF4444; // Rojo
    if (diff <= 0.1) color = 0x00FF88; // Verde
    else if (diff <= 0.25) color = 0xFFA500; // Naranja

    const fill = valObj.fillGraphic;
    fill.clear();
    fill.fillStyle(color, 0.6);
    fill.fillRect(10, (Object.keys(this.nexaValues).indexOf(key) * 45) + 5, valObj.current * 250, 6);
    
    // Actualizar HUD de valores calibrados
    this.updateCalibratedCount();
  }

  createHUD(width, height) {
    const style = { fontFamily: "Orbitron", fontSize: "14px", fill: "#00ffff" };
    this.add.text(20, 20, "ESTACIÓN: KRONOS-V | NÚCLEO: VALORES", style);
    
    this.scoreText = this.add.text(width - 20, 20, `SCORE: ${this.score}`, style).setOrigin(1, 0);
    this.dilemmaCountText = this.add.text(width - 20, 40, `DILEMAS RESUELTOS: 0/4`, style).setOrigin(1, 0);
    
    this.calibratedCountText = this.add.text(width / 2, 20, `VALORES CALIBRADOS: 0/8`, { ...style, fontSize: "16px" }).setOrigin(0.5, 0);

    // Barra salud NEXA
    this.add.text(20, height - 40, "ESTADO NEXA", style);
    this.healthBarBg = this.add.graphics().fillStyle(0x333333, 1).fillRect(20, height - 20, 200, 10);
    this.healthBar = this.add.graphics();
    this.updateNexaHealthBar();
  }

  updateCalibratedCount() {
    let count = 0;
    Object.values(this.nexaValues).forEach(v => {
      if (Math.abs(v.current - v.target) <= 0.1) count++;
    });
    if (this.calibratedCountText) this.calibratedCountText.setText(`VALORES CALIBRADOS: ${count}/8`);
  }

  updateNexaHealthBar() {
    const height = this.scale.height;
    this.healthBar.clear().fillStyle(0x00ffff, 1).fillRect(20, height - 20, (this.nexaHealth / 100) * 200, 10);
  }

  createNexaVisual(width, height) {
    this.nexaContainer = this.add.container(width - 80, 80);
    this.nexaGraphics = this.add.graphics();
    this.nexaContainer.add(this.nexaGraphics);
    
    // Animación suave de pulso
    this.tweens.add({
      targets: this.nexaContainer,
      scale: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  showDilemma(index) {
    const dilemma = this.dilemmas[index];
    this.dilemmaPanel.removeAll(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x0A0A14, 0.9);
    bg.lineStyle(2, 0x334455, 1);
    bg.fillRoundedRect(0, 0, 550, 250, 10);
    bg.strokeRoundedRect(0, 0, 550, 250, 10);
    this.dilemmaPanel.add(bg);

    const title = this.add.text(20, 20, dilemma.title, {
      fontFamily: "Orbitron", fontSize: "18px", fill: "#00ffff"
    });
    this.dilemmaPanel.add(title);

    const text = this.add.text(20, 60, dilemma.text, {
      fontFamily: "monospace", fontSize: "14px", fill: "#ffffff", wordWrap: { width: 510 }
    });
    this.dilemmaPanel.add(text);

    // Caja de decisión
    this.decisionBox = this.add.graphics();
    this.dilemmaPanel.add(this.decisionBox);
    
    this.decisionText = this.add.text(275, 210, "CALCULANDO...", {
      fontFamily: "Orbitron", fontSize: "16px", fill: "#ffffff"
    }).setOrigin(0.5);
    this.dilemmaPanel.add(this.decisionText);

    this.evaluateCurrentDilemma();
    this.showMessage(`NEXA: "${dilemma.nexaQuote}"`, "#00ffff");
  }

  evaluateCurrentDilemma() {
    if (this.isLevelComplete) return;
    
    const dilemma = this.dilemmas[this.currentDilemmaIndex];
    const success = dilemma.check();
    
    this.decisionBox.clear();
    this.decisionBox.fillStyle(0x000000, 0.8);
    this.decisionBox.lineStyle(2, success ? 0x00FF88 : 0xFF4444, 1);
    this.decisionBox.fillRoundedRect(20, 180, 510, 60, 5);
    this.decisionBox.strokeRoundedRect(20, 180, 510, 60, 5);
    
    this.decisionText.setText(success ? dilemma.successText : dilemma.failText);
    this.decisionText.setFill(success ? "#00FF88" : "#FF4444");

    // Mostrar fórmula
    this.updateCalculationView(dilemma.formula(this.nexaValues));

    if (success && !dilemma.isSolved) {
      dilemma.isSolved = true;
      this.onDilemmaSolved();
    }
  }

  updateCalculationView(formula) {
    this.calculationPanel.removeAll(true);
    const txt = this.add.text(0, 0, `CALCULANDO: ${formula}`, {
      fontFamily: "monospace", fontSize: "12px", fill: "#00ffff88"
    }).setOrigin(0.5);
    this.calculationPanel.add(txt);
  }

  onDilemmaSolved() {
    this.score += 150;
    this.dilemmasSolved++;
    this.nexaHealth += 8;
    this.updateNexaHealthBar();
    this.updateHUDText();
    this.playSound("success");

    if (this.dilemmasSolved < 4) {
      this.time.delayedCall(2000, () => {
        this.currentDilemmaIndex++;
        this.showDilemma(this.currentDilemmaIndex);
      });
    } else {
      this.checkFinalCalibration();
    }
  }

  checkFinalCalibration() {
    let allCalibrated = true;
    Object.values(this.nexaValues).forEach(v => {
      if (Math.abs(v.current - v.target) > 0.1) allCalibrated = false;
    });

    if (allCalibrated) {
      this.onVictory();
    } else {
      this.showMessage("Dilemas resueltos. Recalibra los valores restantes (naranja/rojo) para estabilizar el núcleo.", "#ffff00");
      // Permitir que el jugador siga ajustando sliders hasta que todos estén en verde
      const checkInterval = setInterval(() => {
        let ready = true;
        Object.values(this.nexaValues).forEach(v => {
          if (Math.abs(v.current - v.target) > 0.1) ready = false;
        });
        if (ready) {
          clearInterval(checkInterval);
          this.onVictory();
        }
      }, 500);
    }
  }

  onVictory() {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;
    this.playSound("win");
    this.nexaHealth = 100;
    this.updateNexaHealthBar();
    
    // Animación final
    this.runRestorationAnimation();
  }

  runRestorationAnimation() {
    const { width, height } = this.scale;
    
    // Esfera perfecta
    this.nexaGraphics.clear();
    this.nexaGraphics.lineStyle(4, 0x00AAFF, 1);
    this.nexaGraphics.strokeCircle(0, 0, 40);
    this.nexaGraphics.fillStyle(0x00AAFF, 0.4);
    this.nexaGraphics.fillCircle(0, 0, 40);

    // Ondas de energía
    for (let i = 0; i < 5; i++) {
      const circle = this.add.circle(width - 80, 80, 40, 0x00AAFF, 0.5);
      this.tweens.add({
        targets: circle,
        radius: 1200,
        alpha: 0,
        duration: 3000,
        delay: i * 600,
        onComplete: () => circle.destroy()
      });
    }

    const victoryText = this.add.text(width / 2, height / 2, "NEXA — RESTAURADA AL 100%", {
      fontFamily: "Orbitron", fontSize: "40px", fill: "#00AAFF", stroke: "#ffffff", strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1.2,
      duration: 2000,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => this.showFinalDialog());
      }
    });
  }

  showFinalDialog() {
    Swal.fire({
      title: "RESTAURACIÓN COMPLETA",
      html: `
        <div style="text-align: left;">
          <p><strong>NEXA:</strong> "Restauración completa. Percibo. Razono. Y ahora sé qué importa. Los 200 científicos en criostasis están a salvo. Gracias, ROB-EXPLORER. Siempre recordaré esto."</p>
          <p><strong>RUNA:</strong> "Bien hecho, NEXA."</p>
          <p><strong>BYTE:</strong> "Voy a fingir que no me conmovió eso... No lo logré."</p>
        </div>
      `,
      confirmButtonText: "FINALIZAR MISIÓN",
      allowOutsideClick: false,
      customClass: { popup: "custom-popup-class", title: "custom-title-class", confirmButton: "custom-confirm-button-class" }
    }).then(() => {
      this.scene.start("scenaVideo4");
    });
  }

  updateHUDText() {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.dilemmaCountText.setText(`DILEMAS RESUELTOS: ${this.dilemmasSolved}/4`);
  }

  playSound(key, config = {}) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
  }

  showMessage(msg, color = "#ffffff") {
    if (this.msgText) this.msgText.destroy();
    this.msgText = this.add.text(this.scale.width / 2, 380, msg, {
      fontFamily: "Rajdhani", fontSize: "16px", fill: color, backgroundColor: "#000000aa", padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    this.time.delayedCall(4000, () => { if (this.msgText) this.msgText.destroy(); });
  }

  showIntro() {
    Swal.fire({
      title: "NÚCLEO DE VALORES",
      html: `
        <div style="text-align: left;">
          <p><strong>RUNA:</strong> "Núcleo de Valores. El más delicado. No lo fuerces — guíalo."</p>
          <p><strong>NEXA:</strong> "Sé lo que debo ser. Pero no sé cómo serlo. Muéstrame."</p>
          <p><strong>BYTE:</strong> "Ajusta los sliders de valores para que NEXA tome las decisiones éticas correctas en cada dilema. ¡Alinea su IA!"</p>
        </div>
      `,
      confirmButtonText: "INICIAR CALIBRACIÓN",
      customClass: { popup: "custom-popup-class", title: "custom-title-class", confirmButton: "custom-confirm-button-class" }
    });
  }
}

window.Nivel3 = Nivel3;
