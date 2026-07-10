/**
 * Emacs-style kill ring for the TUI editor.
 *
 * When the user kills text (Ctrl+K, Ctrl+U, Ctrl+W), the deleted text is
 * pushed onto a ring. Ctrl+Y yanks the most recent kill; Alt+Y rotates the
 * ring and replaces the last yanked text with the next entry.
 *
 * Consecutive kills (without an intervening yank or other edit) accumulate:
 * the new text is appended to the current top of the ring, so killing a word
 * then killing the next word produces a single ring entry with both words.
 */

export class KillRing {
	private ring: string[] = [];
	private pointer = -1;
	private lastWasKill = false;
	private lastYankStart = -1;
	private lastYankEnd = -1;

	/** Push killed text onto the ring. Consecutive kills accumulate. */
	kill(text: string, accumulate: boolean): void {
		if (accumulate && this.lastWasKill && this.ring.length > 0) {
			this.ring[0] += text;
		} else {
			this.ring.unshift(text);
		}
		this.pointer = 0;
		this.lastWasKill = true;
	}

	/** Yank the top of the ring. Returns the text to insert. */
	yank(): string | undefined {
		if (this.ring.length === 0) return undefined;
		this.pointer = 0;
		this.lastWasKill = false;
		return this.ring[this.pointer];
	}

	/**
	 * Rotate to the next entry and return it (for Alt+Y / yank-pop).
	 * The caller replaces the last yanked text with this new entry.
	 */
	yankPop(): string | undefined {
		if (this.ring.length === 0) return undefined;
		this.pointer = (this.pointer + 1) % this.ring.length;
		return this.ring[this.pointer];
	}

	/** Mark that a non-kill edit happened (resets accumulate behavior). */
	markEdit(): void {
		this.lastWasKill = false;
	}

	/** Record the position of the last yank (for yank-pop replacement). */
	recordYankPosition(start: number, end: number): void {
		this.lastYankStart = start;
		this.lastYankEnd = end;
	}

	get lastYankRange(): { start: number; end: number } | undefined {
		if (this.lastYankStart < 0) return undefined;
		return { start: this.lastYankStart, end: this.lastYankEnd };
	}

	get size(): number {
		return this.ring.length;
	}

	clear(): void {
		this.ring = [];
		this.pointer = -1;
		this.lastWasKill = false;
		this.lastYankStart = -1;
		this.lastYankEnd = -1;
	}
}
