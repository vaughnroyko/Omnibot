declare interface String {
    padLeft (length: number, padWith: string): string;
    weave (...args: any[]): string;
}