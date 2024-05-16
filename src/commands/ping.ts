import {
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from ".";

export const ping: Command = {
	builder: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Pong!")
		.setDescriptionLocalization("ja", "Pong!"),
	execute: async function (i: ChatInputCommandInteraction<CacheType>) {
		const start = Date.now();
		await i.reply("計測中です...");
		await i.editReply(`Pong! \`${Date.now() - start}\`ms`);
	},
};
