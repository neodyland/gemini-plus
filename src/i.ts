import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from "discord.js";
import { resetChat } from "./queue";
import { model, model1_5, visionModel, resolveImages } from "./gemini";
import { req, resetLLamaCppChat } from "./llamacpp";
import {
	characterSelect,
	characterInvite,
	characterCommand,
} from "./characters";

export async function onMenu(i: StringSelectMenuInteraction) {
	if (i.customId === "characters-select") {
		await characterSelect(i);
	}
}

export async function onButton(i: ButtonInteraction) {
	if (i.customId.startsWith("characters-select-")) {
		await characterInvite(i);
	}
}

export async function onModal(i: ModalSubmitInteraction) {}

export async function onInetraction(i: ChatInputCommandInteraction) {
	try {
		switch (i.commandName) {
			case "characters":
				await characterCommand(i);
				break;
			case "help":
				await helpCommand(i);
				break;
			case "ping":
				await pingCommand(i);
				break;
			case "clear":
				await clearCommand(i);
				break;
			case "ask":
				await askCommand(i);
				break;
			default:
				await i.reply("不明なコマンドです");
				break;
		}
		return;
	} catch (e) {
		if (i.replied || i.deferred) {
			await i.editReply("エラーが発生しました");
			return;
		}
		await i.reply("エラーが発生しました");
		console.error(e);
	}
}

async function helpCommand(i: ChatInputCommandInteraction) {
	await i.reply({
		embeds: [
			new EmbedBuilder()
				.setColor("Blue")
				.setTitle("ヘルプ")
				.setDescription("チャンネルに`aichat`を含めるとAIチャットになります。"),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel("サポートサーバー")
					.setURL("https://discord.gg/cyFHD79aw3"),
			),
		],
	});
}

async function pingCommand(i: ChatInputCommandInteraction) {
	const start = Date.now();
	await i.reply("計測中です...");
	await i.editReply(`Pong! \`${Date.now() - start}\`ms`);
}

async function clearCommand(i: ChatInputCommandInteraction) {
	if (
		!i.channel ||
		!("topic" in i.channel) ||
		!i.inGuild() ||
		!i.channel.topic?.includes("aichat")
	) {
		await i.reply(
			"このチャンネルはAIチャットではありません。\nAIチャットにするにはチャンネルトピックに`aichat`を含めてください。",
		);
		return;
	}
	if (i.channel.topic?.includes("unlimited")) {
		resetLLamaCppChat(i.channelId);
	} else {
		resetChat(i.channelId);
	}
	await i.reply("チャットをリセットしました。");
}

async function askCommand(i: ChatInputCommandInteraction) {
	const question = i.options.getString("text", true);
	const attachment = i.options.getAttachment("attachment", false);
	const ephemeral = i.options.getBoolean("ephemeral", false) ?? false;
	const modelName = i.options.getString("model", false) ?? "gemini-pro";
	let resText = "";
	if (modelName === "gemini-pro") {
		let chatFn = model.generateContent.bind(model);
		if (attachment) {
			chatFn = visionModel.generateContent.bind(visionModel);
		}
		const images = await resolveImages(
			attachment
				? [
						{
							url: attachment.url,
							mime: attachment.contentType || "image/png",
						},
				  ]
				: [],
		);
		await i.deferReply({ ephemeral });
		resText = (await chatFn([question, ...images])).response.text();
	} else if (modelName === "gemini-1.5-pro") {
		const chatFn = model1_5.generateContent.bind(model);
		await i.deferReply({ ephemeral });
		resText = (await chatFn([question])).response.text();
	} else if (modelName === "llama-3-8b-instruct") {
		await i.deferReply({ ephemeral });
		resText = await req([
			{
				role: "user",
				content: question,
			},
		]);
	}
	if (resText.length === 0) {
		await i.editReply("AIからの返信がありませんでした");
		return;
	}
	if (resText.length > 2000) {
		await i.editReply({
			content: "長文です",
			files: [{ attachment: Buffer.from(resText), name: "reply.txt" }],
		});
		return;
	}
	await i.editReply(resText);
}
