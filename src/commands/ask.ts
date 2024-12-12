import {
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from ".";
import { uploadAttachment, models } from "../chat";

export const ask: Command = {
	builder: new SlashCommandBuilder()
		.setName("ask")
		.setDescription("Ask to an AI")
		.setDescriptionLocalization("ja", "AIに質問します")
		.addStringOption((x) =>
			x
				.setName("text")
				.setDescription("Text to ask")
				.setDescriptionLocalization("ja", "質問するテキスト")
				.setRequired(true),
		)
		.addAttachmentOption((x) =>
			x.setName("attachment").setDescription("質問する画像").setRequired(false),
		)
		.addStringOption((x) =>
			x
				.setName("model")
				.setDescription("モデルを指定します")
				.setRequired(false)
				.addChoices(
					...models.map((m) => ({
						name: m.name,
						value: m.id,
					})),
				),
		)
		.addBooleanOption((x) =>
			x
				.setName("ephemeral")
				.setDescription("あなたにしか見えなくします")
				.setRequired(false),
		)
		.addStringOption((x) =>
			x
				.setName("system")
				.setDescription("システムプロンプトを指定します")
				.setRequired(false),
		),
	execute: async function (i: ChatInputCommandInteraction<CacheType>) {
		const question = i.options.getString("text", true);
		const attachment = i.options.getAttachment("attachment", false);
		const ephemeral = i.options.getBoolean("ephemeral", false) ?? false;
		const modelName = i.options.getString("model", false) ?? "gemini-1.0-pro";
		const system = i.options.getString("system", false);
		const model = models.find((m) => m.id === modelName);
		if (!model) {
			await i.reply("Model not found");
			return;
		}
		await i.deferReply({ ephemeral });
		const chat = [
			{
				role: "user" as const,
				text: question,
				attachment: attachment
					? [
							{
								mime: attachment.contentType || "application/octet-stream",
								data: await uploadAttachment(
									attachment.url,
									attachment.contentType || "application/octet-stream",
								),
							},
						]
					: undefined,
			},
		];
		const gen = await model.generate(chat, system || undefined);
		let tokens = 0;
		let lastTokens = 0;
		let content = "";
		for await (const { tokens: t, content: c } of gen) {
			tokens += t;
			content += c;
			if (tokens - lastTokens > 100) {
				await i.editReply(
					content.length < 2000
						? content
						: {
								files: [
									{
										attachment: Buffer.from(content),
										name: "output.txt",
									},
								],
							},
				);
				lastTokens = tokens;
			}
		}
		content = `Tokens: ${tokens}\n${content}`;
		await i.editReply(
			content.length < 2000
				? content
				: {
						files: [
							{
								attachment: Buffer.from(content),
								name: "output.txt",
							},
						],
					},
		);
	},
};
