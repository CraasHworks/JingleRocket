export class SoundManager {
    private sounds: Map<string, HTMLAudioElement[]>;
    private musicTracks: Map<string, HTMLAudioElement[]>;
    private currentMusic: HTMLAudioElement | null;
    private musicVolume: number;
    private soundVolume: number;
    private isUserInteracted: boolean = false;
    private readonly MAX_CHANNELS: number = 16;
    private readonly MAX_MUSIC_TRACKS: number = 2;

    constructor() {
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        this.musicVolume = 0.8; // Default music volume
        this.soundVolume = 0.5; // Default sound effects volume

        // Ensure sound can play after user interaction
        document.addEventListener("click", this.enableSound.bind(this), { once: true });
        document.addEventListener("keydown", this.enableSound.bind(this), { once: true });
    }

    /**
     * Load a sound effect and prepare a pool of audio channels.
     * @param name - The unique name of the sound effect.
     * @param path - The path to the sound file.
     */
    loadSound(name: string, path: string): void {
        if (this.sounds.has(name)) {
            console.warn(`Sound "${name}" is already loaded.`);
            return;
        }

        const audioPool: HTMLAudioElement[] = [];
        for (let i = 0; i < this.MAX_CHANNELS; i++) {
            const audio = new Audio(path);
            audio.volume = this.soundVolume;
            audioPool.push(audio);
        }
        this.sounds.set(name, audioPool);
    }

    /**
     * Load a music track and prepare a pool for seamless transitions.
     * @param name - The unique name of the music track.
     * @param path - The path to the music file.
     */
    loadMusic(name: string, path: string): void {
        if (this.musicTracks.has(name)) {
            console.warn(`Music "${name}" is already loaded.`);
            return;
        }

        const musicPool: HTMLAudioElement[] = [];
        for (let i = 0; i < this.MAX_MUSIC_TRACKS; i++) {
            const audio = new Audio(path);
            audio.volume = this.musicVolume;
            musicPool.push(audio);
        }
        this.musicTracks.set(name, musicPool);
    }

    private enableSound(): void {
        this.isUserInteracted = true;
        console.log("Audio enabled after user interaction");
    }

    /**
     * Play a sound effect by name.
     * @param name - The unique name of the sound effect.
     */
    playSound(name: string): void {
        if (!this.isUserInteracted) {
            console.warn("Cannot play sound before user interaction.");
            return;
        }

        const soundPool = this.sounds.get(name);
        if (soundPool) {
            const audio = this.getAvailableAudio(soundPool);
            if (audio) {
                audio.currentTime = 0; // Restart sound if already playing
                audio.play().catch(error => console.error(`Failed to play sound "${name}":`, error));
            } else {
                console.warn(`All channels for sound "${name}" are busy!`);
            }
        } else {
            console.warn(`Sound "${name}" not found!`);
        }
    }

    /**
     * Play a music track by name.
     * @param name - The unique name of the music track.
     * @param loop - Whether the music should loop (default: true).
     */
    playMusic(name: string, loop: boolean = true): void {
        if (!this.isUserInteracted) {
            console.warn("Cannot play music before user interaction.");
            return;
        }

        const musicPool = this.musicTracks.get(name);
        if (musicPool) {
            const audio = this.getAvailableAudio(musicPool);
            if (audio) {
                if (this.currentMusic) {
                    this.currentMusic.pause();
                }

                audio.currentTime = 0;
                audio.loop = loop;
                audio.play().catch(error => console.error(`Failed to play music "${name}":`, error));
                this.currentMusic = audio;
            } else {
                console.warn(`All tracks for music "${name}" are busy!`);
            }
        } else {
            console.warn(`Music "${name}" not found!`);
        }
    }

    /**
     * Stop the currently playing music.
     */
    stopMusic(): void {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    /**
     * Get an available audio instance from the pool or return null if all are busy.
     * @param pool - The pool of audio elements.
     * @returns An available audio element or null.
     */
    private getAvailableAudio(pool: HTMLAudioElement[]): HTMLAudioElement | null {
        for (const audio of pool) {
            if (audio.paused || audio.ended) {
                return audio;
            }
        }
        return null;
    }

    /**
     * Set the music volume.
     * @param volume - A value between 0.0 and 1.0.
     */
    setMusicVolume(volume: number): void {
        this.musicVolume = Math.min(Math.max(volume, 0), 1);
        this.musicTracks.forEach(pool => {
            pool.forEach(audio => {
                audio.volume = this.musicVolume;
            });
        });
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }

    /**
     * Set the sound effects volume.
     * @param volume - A value between 0.0 and 1.0.
     */
    setSoundVolume(volume: number): void {
        this.soundVolume = Math.min(Math.max(volume, 0), 1);
        this.sounds.forEach(pool => {
            pool.forEach(audio => {
                audio.volume = this.soundVolume;
            });
        });
    }
}
