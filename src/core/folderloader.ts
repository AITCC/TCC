import { Folder } from "./folder";

export interface FolderLoader {
  loadFolder(path: string): Folder;
}