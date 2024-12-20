import {
	BaseGuildTextChannel,
	Collection,
	MessageEditOptions,
} from "discord.js";
import { Chat, models } from "./chat";
import { client } from ".";

const channelSpecificHistory = new Collection<string, Chat[]>();
const chatQueue = new Collection<
	string,
	{ queue: (Chat & { id: string })[]; processing: boolean; model: string }
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
		model: "gemini-1.5-flash-small",
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
			model: modelId,
		});
		const model = models.find((x) => x.id === modelId)!;
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
					let contents = "";
					for await (const c of res) {
						contents += c;
					}
					const payload: MessageEditOptions = {};
					if (contents.length < 2000) {
						payload["content"] = contents;
					} else {
						payload["files"] = [
							{
								attachment: Buffer.from(contents),
								name: "output.txt",
							},
						];
					}
					await msg?.edit(payload);
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
					model: modelId,
				});
			});
	}
}, 1000);

export function addChatQueue(
	channelId: string,
	chat: Chat & { id: string },
	model: string,
) {
	if (!chatQueue.has(channelId)) {
		chatQueue.set(channelId, {
			queue: [],
			processing: false,
			model,
		});
	}
	chatQueue.get(channelId)!.queue.push(chat);
	chatQueue.set(channelId, { ...chatQueue.get(channelId)!, model });
}
