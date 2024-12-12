import { gemini15Flash, gemini15FlashSmall, gemini15Pro, gemini20Flash } from "./gemini";

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

export const models = [gemini15Flash, gemini15Pro, gemini15FlashSmall, gemini20Flash];

export async function getAttachmentBase64(url: string) {
	const res = await fetch(url);
	const data = await res.blob();
	const buf = Buffer.from(await data.arrayBuffer());
	return buf.toString("base64");
}
