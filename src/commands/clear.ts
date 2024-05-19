import {
	ChatInputCommandInteraction,
	CacheType,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from ".";
import { clearHistory } from "../queue";

export const clear: Command = {
	builder: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Clear chat history")
		.setDescriptionLocalization("ja", "チャット履歴を消去"),
	execute: function (
		i: ChatInputCommandInteraction<CacheType>,
	): void | Promise<void> {
		clearHistory(i.channelId);
		i.reply("Chat history cleared");
	},
};
