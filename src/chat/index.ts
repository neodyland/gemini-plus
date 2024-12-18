import {
	gemini15Flash,
	gemini15FlashSmall,
	gemini15Pro,
	gemini20Flash,
	files,
} from "./gemini";
import { writeFile, rm, mkdir, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export interface Chat {
	role: "user" | "assistant" | "system";
	text: string;
	attachment?: {
		mime: string;
		data: string;
	}[];
}

export interface ChatModel {
	generate(chat: Chat[], system?: string): Promise<AsyncGenerator<string>>;
	name: string;
	id: string;
}

export const models = [
	gemini15Flash,
	gemini15Pro,
	gemini15FlashSmall,
	gemini20Flash,
];

export async function uploadAttachment(url: string, mime: string) {
	const buf = await (await fetch(url)).arrayBuffer();
	try {
		(await stat("./tmp")).isDirectory();
	} catch {
		await mkdir("./tmp");
	}
	const path = `./tmp/${randomUUID()}`;
	await writeFile(path, Buffer.from(buf));
	try {
		return (await files.uploadFile(path, { mimeType: mime })).file.uri;
	} finally {
		await rm(path);
	}
}
