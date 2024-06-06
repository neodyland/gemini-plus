import { request } from "undici";
import type { Chat, ChatModel } from ".";
import { evarOptional } from "../var";

const endpoint = evarOptional("LLAMA_CPP_ENDPOINT");

function resolveAttachment(attachment?: {
	mime: string;
	data: string;
}) {
	if (!attachment) {
		return;
	}
	if (["image/png", "image/jpeg", "image/gif"].includes(attachment.mime)) {
		return attachment.data;
	}
	return;
}

async function* generate(chat: Chat[], system?: string) {
	if (system) {
		chat.unshift({
			role: "system",
			text: system,
		});
	}
	if (!endpoint) {
		throw new Error("LLAMA_CPP_ENDPOINT not set");
	}
	const res = await request(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(
			chat.map((c) => ({
				content: c.text,
				role: c.role,
				image: resolveAttachment(c.attachment),
			})),
		),
	});
	const data: any = await res.body.json();
	yield {
		tokens: data.tokens,
		content: data.content,
	};
}

export const llama: ChatModel = {
	name: "Local Model",
	id: "local",
	async generate(chat, system) {
		return generate(chat, system);
	},
};
