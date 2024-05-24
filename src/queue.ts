import { BaseGuildTextChannel, Collection } from "discord.js";
import { Chat, models } from "./chat";
import { client } from ".";

const channelSpecificHistory = new Collection<string, Chat[]>();
const chatQueue = new Collection<
	string,
	{ queue: (Chat & { id: string })[]; processing: boolean; model?: string }
>();

function addHistory(channelId: string, chat: Chat) {
	channelSpecificHistory.set(channelId, [
		...(channelSpecificHistory.get(channelId) || []),
		chat,
	]);
}

export function clearHistory(channelId: string) {
	channelSpecificHistory.set(channelId, []);
	chatQueue.set(channelId, {
		queue: [],
		processing: false,
	});
}

setInterval(() => {
	for (const [channelId, { queue, processing, model: modelId }] of chatQueue) {
		if (processing) continue;
		if (queue.length === 0) continue;
		const chat = queue.shift()!;
		chatQueue.set(channelId, {
			queue,
			processing: true,
		});
		const model = models.find((x) => x.id === modelId || "gemini-1.5-flash")!;
		model
			.generate([...(channelSpecificHistory.get(channelId) || []), chat])
			.then(async (res) => {
				let msg = undefined;
				try {
					const ch = client.channels.cache.get(channelId) as
						| BaseGuildTextChannel
						| undefined;
					msg = await ch?.send({
						content: "Generating...",
						reply: {
							messageReference: chat.id,
						},
					});
					try {
						const msg = await ch?.messages.fetch(chat.id);
						msg?.reactions.removeAll();
					} catch {
						console.error("Failed to fetch message");
					}
					let tokens = 0;
					let lastTokens = 0;
					let contents = "";
					for await (const { tokens: t, content: c } of res) {
						tokens += t;
						contents += c;
						if (tokens - lastTokens > 100) {
							await msg?.edit(contents);
							lastTokens = tokens;
						}
					}
					await msg?.edit(contents);
					addHistory(channelId, chat);
					addHistory(channelId, {
						text: contents,
						role: "assistant",
					});
				} catch (e) {
					console.error(e);
					if (msg) {
						try {
							await msg.edit("Failed to generate message");
						} catch {}
					}
				}
				chatQueue.set(channelId, {
					queue,
					processing: false,
				});
			});
	}
}, 1000);

export function addChatQueue(
	channelId: string,
	chat: Chat & { id: string },
	model?: string,
) {
	if (!chatQueue.has(channelId)) {
		chatQueue.set(channelId, {
			queue: [],
			processing: false,
			model,
		});
	}
	chatQueue.get(channelId)!.queue.push(chat);
}
