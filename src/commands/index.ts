import type {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { ask } from "./ask";
import { help } from "./help";
import { clear } from "./clear";
import { ping } from "./ping";

export interface Command {
	builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (i: ChatInputCommandInteraction) => void | Promise<void>;
}

export const commands = [ask, help, clear, ping];
