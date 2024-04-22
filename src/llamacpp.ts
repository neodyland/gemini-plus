import { Message } from "discord.js";
import { evar } from "./var";

const endpoint = evar("LLAMA_CPP_ENDPOINT");

export async function req(
	prompt: {
		role: string;
		content: string;
	}[],
): Promise<string> {
	const res = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(prompt),
	});
	const data = await res.json();
	return JSON.stringify(data);
}

const reqQueue: {
	prompt: { role: string; content: string }[];
	callback: (data: string) => void;
}[] = [];

async function reqWithQueue(prompt: { role: string; content: string }[]) {
	return new Promise<string>((resolve, reject) => {
		reqQueue.push({
			prompt,
			callback: (data) => {
				resolve(data);
			},
		});
		if (reqQueue.length === 1) {
			(async () => {
				while (reqQueue.length) {
					const { prompt, callback } = reqQueue[0];
					const dataJson = await req(prompt);
					callback(dataJson);
					reqQueue.shift();
				}
			})();
		}
	});
}

export class LLamaCppChat {
	history: { user: string; message: string }[] = [];
	constructor() {}
	async chat(message: string): Promise<string> {
		this.history.push({ user: "user", message });
		try {
			const data = await reqWithQueue(
				this.history.map((x) => ({
					role: x.user === "user" ? "user" : "assistant",
					content: x.message,
				})),
			);
			const resJson = JSON.parse(data);
			const resText = resJson.content;
			this.history.push({ user: "bot", message: resText });
			return data;
		} catch (e: any) {
			return `エラーが発生しました: ${e.toString()}`;
		}
	}
}

export const llamaCppQueues = new Map<
	string,
	{ chat: LLamaCppChat; queue: { text: string; message: Message<true> }[] }
>();

export function resetLLamaCppChat(channelId: string) {
	if (llamaCppQueues.has(channelId)) {
		const q = llamaCppQueues.get(channelId)!;
		q.chat = new LLamaCppChat();
		llamaCppQueues.set(channelId, q);
	}
}

export async function pushLLamaCppQueue(
	content: string,
	message: Message<true>,
) {
	if (!llamaCppQueues.has(message.channelId)) {
		llamaCppQueues.set(message.channelId, {
			chat: new LLamaCppChat(),
			queue: [],
		});
	}
	const { chat, queue } = llamaCppQueues.get(message.channelId)!;
	if (queue.length !== 0) {
		queue.push({ text: content, message });
		return;
	}
	queue.push({ text: content, message });
	while (queue.length) {
		const { text, message } = queue.shift()!;
		const msg = await message.reply("ラマは思考しています... <a:discordloading:1225433214500343808>");
		const res = await chat.chat(text);
		console.log(res);
		const resJson = JSON.parse(res);
		const resText = resJson.content;
		const tokens = resJson.tokens;
		const time = resJson.time.toFixed(2);
		const tps = ((tokens / time).toFixed(2) as any) as number;
		if (resText.length == 0) {
			await msg.edit("ラマは疲れているようです...");
			continue;
		}
		if (resText.length > 1900) {
			await msg.edit({
				content: "熟考しすぎてしまったようです\n\n:memo: ${tokens}T | :stopwatch: ${time}s | :zap: ${tps}TPS",
				files: [{ attachment: Buffer.from(resText), name: "reply.txt" }],
			});
			continue;
		}
		await msg.edit(`ラマは元気に返事をしてくれました！\n${resText}\n\n:memo: ${tokens}T | :stopwatch: ${time}s | :zap: ${tps}TPS`);
	}
}
