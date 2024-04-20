import { SlashCommandBuilder } from "discord.js";

export const commands = [
	new SlashCommandBuilder()
		.setName("characters")
		.setDescription("AIキャラクターをチャットに招待する"),
	new SlashCommandBuilder()
		.setName("help")
		.setDescription("ヘルプを表示します"),
	new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
	new SlashCommandBuilder()
		.setName("clear")
		.setDescription("AIチャットをリセットします"),
	new SlashCommandBuilder()
		.setName("wolfram")
		.setDescription("Wolfram Alphaに質問します")
		.addStringOption((x) =>
			x.setName("text").setDescription("質問する内容").setRequired(true),
		)
		.addStringOption((x) =>
			x
				.setName("format")
				.setDescription("出力形式を指定します")
				.setRequired(false)
				.addChoices(
					{ name: "分析画像", value: "image" },
					{ name: "短文", value: "short" },
				),
		),
	new SlashCommandBuilder()
		.setName("ask")
		.setDescription("AIに質問します")
		.addStringOption((x) =>
			x.setName("text").setDescription("質問する内容").setRequired(true),
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
					{ name: "Gemini 1.0 Pro", value: "gemini-pro" },
					{ name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
					{ name: "Llama 3 8b Instruct", value: "llama-3-8b-instruct" },
				),
		)
		.addBooleanOption((x) =>
			x
				.setName("ephemeral")
				.setDescription("あなたにしか見えなくします")
				.setRequired(false),
		),
];
