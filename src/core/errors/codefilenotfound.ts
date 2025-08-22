export class CodeFileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeFileNotFoundError';
    Object.setPrototypeOf(this, CodeFileNotFoundError.prototype);
  }
}