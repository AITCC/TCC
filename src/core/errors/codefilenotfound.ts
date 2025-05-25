export class CodeFileNotFoundError extends Error {
  constructor(message: string, public filePath: string) {
    super(message);
    this.name = 'CodeFileNotFoundError';
    Object.setPrototypeOf(this, CodeFileNotFoundError.prototype);
  }
}