/**
 * Convert numbers into French words (e.g. 205000 -> "Deux Cent Cinq Mille")
 */
export function numberToFrenchWords(n: number | null | undefined): string {
    if (n === null || n === undefined || isNaN(n)) return "";
    n = Math.floor(Math.abs(n));
    if (n === 0) return "Zéro";

    const units = [
        "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
        "dix-sept", "dix-huit", "dix-neuf"
    ];
    const tens = [
        "", "", "vingt", "trente", "quarante", "cinquante", "soixante",
        "soixante-dix", "quatre-vingt", "quatre-vingt-dix"
    ];

    function convertUnder100(num: number): string {
        if (num === 0) return "";
        if (num < 20) return units[num];
        const t = Math.floor(num / 10);
        const u = num % 10;
        if (t === 7) {
            if (u === 1) return "soixante et onze";
            return "soixante-" + units[10 + u];
        }
        if (t === 8) {
            if (u === 0) return "quatre-vingts";
            return "quatre-vingt-" + units[u];
        }
        if (t === 9) {
            return "quatre-vingt-" + units[10 + u];
        }
        if (u === 1) return tens[t] + " et un";
        if (u > 1) return tens[t] + "-" + units[u];
        return tens[t];
    }

    function convertUnder1000(num: number): string {
        if (num === 0) return "";
        const c = Math.floor(num / 100);
        const rem = num % 100;
        let res = "";
        if (c === 1) {
            res = "cent";
        } else if (c > 1) {
            res = units[c] + " cent" + (rem === 0 ? "s" : "");
        }
        if (rem > 0) {
            const remStr = convertUnder100(rem);
            res = res ? res + " " + remStr : remStr;
        }
        return res;
    }

    const billions = Math.floor(n / 1000000000);
    let rem = n % 1000000000;
    const millions = Math.floor(rem / 1000000);
    rem = rem % 1000000;
    const thousands = Math.floor(rem / 1000);
    const ones = rem % 1000;

    const parts: string[] = [];
    if (billions > 0) {
        parts.push(convertUnder1000(billions) + (billions > 1 ? " milliards" : " milliard"));
    }
    if (millions > 0) {
        parts.push(convertUnder1000(millions) + (millions > 1 ? " millions" : " million"));
    }
    if (thousands > 0) {
        if (thousands === 1) {
            parts.push("mille");
        } else {
            parts.push(convertUnder1000(thousands) + " mille");
        }
    }
    if (ones > 0) {
        parts.push(convertUnder1000(ones));
    }

    const raw = parts.join(" ").trim();
    return raw
        .split(" ")
        .map(word => {
            if (!word) return "";
            if (word.includes("-")) {
                return word.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}
