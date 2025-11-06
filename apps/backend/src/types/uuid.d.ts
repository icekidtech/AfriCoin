declare module 'uuid' {
  export function v4(): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
  export function parse(uuid: string): Uint8Array;
  export function stringify(bytes: Uint8Array): string;
}