export function buildInt64(array: Array<number>) {
    let bigIntArray = new BigInt64Array(array.length);

    for (let i = 0; i < array.length; i++) {
        bigIntArray[i] = BigInt(array[i]);
    }

    return bigIntArray
}

export function sigmoid(x: number) {
    return 1 / (1 + Math.exp(-x));
}

export const labelMap = {
    admiration: "👏",
    amusement: "😂",
    anger: "😡",
    annoyance: "😒",
    approval: "👍",
    caring: "🤗",
    confusion: "😕",
    curiosity: "🤔",
    desire: "😍",
    disappointment: "🙁",
    disapproval: "👎",
    disgust: "🤮",
    embarrassment: "😳",
    excitement: "🤩",
    fear: "😨",
    gratitude: "🙏",
    grief: "😢",
    joy: "😃",
    love: "❤️",
    nervousness: "😬",
    optimism: "🤞",
    pride: "😌",
    realization: "💡",
    relief: "😅",
    remorse: "😔",
    sadness: "😞",
    surprise: "😯",
    neutral: "😶",
}
