/**
 * Menghasilkan nama planet berdasarkan seed_string.
 * Jika seed_string sama, nama output PASTI sama.
 */
export function generatePlanetName(seedString: string): string {
    const rng = new SeededRandom(seedString);

    const prefixes = ["Xan", "Bor", "Kry", "Nov", "Zea", "Omi", "Uyt", "Rha", "Vek", "Ly"];
    const mids = ["tar", "pho", "dil", "xis", "ku", "lo", "rat", "gen", "nix"];
    const suffixes = ["on", "ia", "us", "vis", "os", "tune", "nium", " prime", " Major", " Minor"];
    const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "X"];

    const isLongName = rng.choice([true, false]);

    let name = rng.choice(prefixes);

    if (isLongName) {
        name += rng.choice(mids);
    }

    name += rng.choice(suffixes);

    // 2. Tambahkan angka romawi jika rng menghendaki (30% chance)
    if (rng.next() > 0.7) {
        name += " " + rng.choice(romanNumerals);
    }

    return toTitleCase(name);
}

class SeededRandom {
    private seed: number;

    constructor(seedStr: string) {
        // Simple hash function to generate a numeric seed from string
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    // Linear Congruential Generator
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }

    choice<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

function toTitleCase(str: string): string {
    return str.toLowerCase().split(' ').map(function(word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}