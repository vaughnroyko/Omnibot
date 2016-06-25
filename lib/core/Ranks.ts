enum Ranks {
    new = 0,
    user = 0,
    regular = 1,
    viewer = 1,
    mod = 2,
    moderator = 2,
    admin = 3,
    administrator = 3,
    channel = 4,
    broadcaster = 4,
    bot = 5,
}
function clamp (num: number, min?: number, max?: number) {
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    return num;
}
module Ranks {
    export function get (which: string | number): Ranks {
        return typeof which == "number" ? clamp(Math.floor(which as number), Ranks.new, Ranks.bot) : (Ranks as any)[which];
    }
}
export = Ranks;