export class CodeFile {
    private _content: string = '';

    constructor(
        public name: string
    ) {}

    read(): string {
        return this._content;
    }

    write(content: string): void {
        this._content = content;
    }
}