import { request } from "undici";
import {
	gemini15Flash,
	gemini15Pro,
} from "./gemini";

export interface Chat {
	role: "user" | "assistant" | "system";
	text: string;
	attachment?: {
		mime: string;
		data: string;
	}; // base64
}

export interface ChatModel {
	generate(
		chat: Chat[],
		system?: string,
	): Promise<
		AsyncGenerator<{
			tokens: number;
			content: string;
		}>
	>;
	name: string;
	id: string;
}

export const models = [
	gemini15Flash,
	gemini15Pro,
];

export async function getAttachmentBase64(url: string) {
	const res = await request(url);
	const data = await res.body.blob();
	const buf = Buffer.from(await data.arrayBuffer());
	return buf.toString("base64");
}
