export class FolderNotFoundError extends Error {
  constructor(message: string, public path?: string) {
    super(message);
    this.name = "FolderNotFoundError";
    Object.setPrototypeOf(this, FolderNotFoundError.prototype);
  }
}