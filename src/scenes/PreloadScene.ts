import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);

    this.load.image('player', 'sprites/player.png');
    this.load.image('enemy-zombie', 'sprites/enemy-zombie.png');
    this.load.image('enemy-skeleton', 'sprites/enemy-skeleton.png');
    this.load.image('enemy-mushroom', 'sprites/enemy-mushroom.png');
    this.load.image('boss-ogre', 'sprites/boss-ogre.png');

    this.load.audio('sfx-attack', 'audio/attack.ogg');
    this.load.audio('sfx-critical', 'audio/critical.ogg');
    this.load.audio('sfx-hurt', 'audio/hurt.ogg');
    this.load.audio('sfx-kill', 'audio/kill.ogg');
    this.load.audio('sfx-misfire', 'audio/misfire.ogg');
    this.load.audio('sfx-click', 'audio/click.ogg');
    this.load.audio('jingle-floor-clear', 'audio/jingle-floor-clear.ogg');
    this.load.audio('jingle-victory', 'audio/jingle-victory.ogg');
    this.load.audio('jingle-game-over', 'audio/jingle-game-over.ogg');
  }

  create(): void {
    this.scene.start('Title');
  }
}
