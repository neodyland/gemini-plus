import {
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { Command } from ".";

export const help: Command = {
	builder: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Help command")
		.setDescriptionLocalization("ja", "ヘルプ"),
	execute: async function (i: ChatInputCommandInteraction<CacheType>) {
		await i.reply({
			embeds: [
				new EmbedBuilder()
					.setColor("Blue")
					.setTitle("ヘルプ")
					.setDescription(
						"チャンネルに`aichat`を含めるとAIチャットになります。",
					),
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
	},
};
