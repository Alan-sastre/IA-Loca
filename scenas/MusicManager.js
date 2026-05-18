class MusicManager {
  constructor() {
    this.music = null;
  }

  static getInstance() {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  setMusic(music) {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
    this.music = music;
    this.music.setLoop(true);
  }

  playMusic() {
    if (this.music && !this.music.isPlaying) {
      this.music.play();
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
    }
  }

  isPlaying() {
    return this.music && this.music.isPlaying;
  }
}

MusicManager.instance = null;
