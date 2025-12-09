import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function saveFile(file: Blob, directory: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filepath = join(process.cwd(), `public/${directory}`, filename);
    await writeFile(filepath, buffer);
    return `/${directory}/${filename}`;
}
