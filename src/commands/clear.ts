import {
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from ".";

export const clear: Command = {
	builder: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Clear chat history")
		.setDescriptionLocalization("ja", "チャット履歴を消去"),
	execute: function (
		i: ChatInputCommandInteraction<CacheType>,
	): void | Promise<void> {
		throw new Error("Function not implemented.");
	},
};
