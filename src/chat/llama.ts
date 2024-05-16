import { request } from "undici";
import type { Chat, ChatModel } from ".";
import { evar } from "../var";

const endpoint = evar("LLAMA_CPP_ENDPOINT");

async function* generate(chat: Chat[], system?: string) {
	if (system) {
		chat.unshift({
			role: "system",
			text: system,
		});
	}
	const res = await request(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(chat),
	});
	res.body.setEncoding("utf-8");
	const data = JSON.parse(await res.body.text());
	yield {
		tokens: data.tokens,
		content: data.content,
	};
}

export const llama: ChatModel = {
	name: "Llama3 8b Instruct",
	id: "llama-3-8b-instruct",
	async generate(chat, system) {
		return generate(chat, system);
	},
};
