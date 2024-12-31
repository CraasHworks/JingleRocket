export class LoaderScreen {
    private loaderScreen: HTMLElement;
    private pressPlay: HTMLElement;
    private loadingBar: HTMLElement;
    private loadingMessage: HTMLElement;
    private commodorePattern: HTMLElement;
    private isDev: boolean;
    private loadingSequence: Promise<void> | null = null;

    private readonly NORMAL_MESSAGES = [
        "Initializing quantum flux capacitor...",
        "Downloading more RAM...",
        "Teaching AI to play Pong...",
        "Reticulating splines...",
        "Generating witty loading messages...",
        "Solving P vs NP problem...",
        "Proving Fermat's Last Theorem...",
        "Calculating the meaning of life...",
        "Compressing time itself...",
        "Dividing by zero..."
    ];

    private readonly COMMODORE_MESSAGES = [
        "LOAD \"*\",8,1",
        "SEARCHING FOR JINGLE-ROCKET",
        "LOADING",
        "?SYNTAX ERROR",
        "?DEVICE NOT PRESENT",
        "PRESS PLAY ON TAPE"
    ];

    private readonly FILE_BROWSING_MESSAGES = [
        "Accessing system files...",
        "Found user's browser history...",
        "Oh my... what's this folder?",
        "😳 These images are... interesting",
        "Better delete this quickly",
        "No one needs to see that",
        "Clearing browser history...",
        "Pretending this never happened"
    ];

    constructor(isDev: boolean = false) {
        this.isDev = isDev;
        this.loaderScreen = document.getElementById('loader-screen')!;
        this.pressPlay = document.getElementById('press-play')!;
        this.loadingBar = document.getElementById('loading-bar')!;
        this.loadingMessage = document.getElementById('loading-message')!;
        this.commodorePattern = document.getElementById('commodore-pattern')!;

        if (this.isDev) {
            this.loaderScreen.style.display = 'none';
        }
    }

    private async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private setProgress(progress: number): void {
        this.loadingBar.style.width = `${progress}%`;
    }

    private setMessage(message: string): void {
        this.loadingMessage.textContent = message;
    }

    private async showMessageSequence(messages: string[], duration: number, progressStart: number, progressEnd: number): Promise<void> {
        const timePerMessage = duration / messages.length;
        const progressPerMessage = (progressEnd - progressStart) / messages.length;

        for (let i = 0; i < messages.length; i++) {
            this.setMessage(messages[i]);
            this.setProgress(progressStart + (progressPerMessage * i));
            await this.wait(timePerMessage);
        }
    }

    private async simulateCommodoreLoading(): Promise<void> {
        this.commodorePattern.style.opacity = '0.3';
        await this.showMessageSequence(this.COMMODORE_MESSAGES, 5000, 30, 50);
        this.setMessage("WRONG SYSTEM DETECTED!");
        await this.wait(1000);
        this.commodorePattern.style.opacity = '0';
    }

    private async simulateFileBrowsing(): Promise<void> {
        await this.showMessageSequence(this.FILE_BROWSING_MESSAGES, 6000, 70, 90);
    }

    public async startLoading(): Promise<void> {
        if (this.isDev) return;

        if (this.loadingSequence) return this.loadingSequence;

        this.loadingSequence = new Promise<void>(async (resolve) => {
            // Wait for any key press
            const handleKeyPress = () => {
                document.removeEventListener('keydown', handleKeyPress);
                this.pressPlay.style.display = 'none';
                this.startLoadingSequence().then(resolve);
            };
            document.addEventListener('keydown', handleKeyPress);
        });

        return this.loadingSequence;
    }

    private async startLoadingSequence(): Promise<void> {
        // Initial loading messages
        await this.showMessageSequence(this.NORMAL_MESSAGES.slice(0, 4), 4000, 0, 30);

        // Commodore 64 loading attempt
        await this.simulateCommodoreLoading();

        // More normal loading
        await this.showMessageSequence(this.NORMAL_MESSAGES.slice(4, 7), 3000, 50, 70);

        // File browsing sequence
        await this.simulateFileBrowsing();

        // Final loading
        await this.showMessageSequence(this.NORMAL_MESSAGES.slice(7), 2000, 90, 100);

        // Complete loading
        this.setMessage("Loading complete!");
        await this.wait(500);

        // Hide loader
        this.loaderScreen.style.display = 'none';
    }

    public setDevMode(isDev: boolean): void {
        this.isDev = isDev;
        if (isDev) {
            this.loaderScreen.style.display = 'none';
        }
    }
}