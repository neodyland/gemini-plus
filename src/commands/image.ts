import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	CacheType,
} from "discord.js";
import { Command } from ".";
import { evarOptional } from "../var";

const imageEndpoint = evarOptional("IMAGE_ENDPOINT");

export const image: Command = {
	builder: new SlashCommandBuilder()
		.setName("imagine")
		.setDescription("Create an image from text")
		.addStringOption((option) =>
			option
				.setName("pos")
				.setDescription("The positive text")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("neg")
				.setDescription("The negative text")
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option.setName("seed").setDescription("The seed for the image"),
		)
		.addStringOption((option) =>
			option
				.setName("size")
				.setDescription("The size of the image")
				.addChoices(
					[
						"1:1",
						"8:7",
						"7:8",
						"19:13",
						"13:19",
						"7:4",
						"4:7",
						"12:5",
						"5:12",
					].map((s) => ({
						name: s,
						value: s,
					})),
				),
		),
	async execute(i: ChatInputCommandInteraction<CacheType>) {
		if (!imageEndpoint) {
			await i.reply("Image endpoint not provided");
			return;
		}
		const pos = i.options.getString("pos", true);
		const neg = i.options.getString("neg", false);
		const seed = i.options.getInteger("seed", false);
		const size = i.options.getString("size", false);
		const url = new URL(imageEndpoint);
		url.searchParams.append("pos", pos);
		if (neg) url.searchParams.append("neg", neg);
		if (seed) url.searchParams.append("seed", seed.toString());
		if (size) url.searchParams.append("size", size);
		await i.deferReply();
		try {
			const img = await fetch(url.toString());
			if (!img.ok) {
				await i.editReply("Failed to fetch image");
				return;
			}
			await i.editReply({
				files: [
					{
						name: "image.png",
						attachment: Buffer.from(await (await img.blob()).arrayBuffer()),
					},
				],
			});
		} catch (e) {
			console.error(e);
			await i.editReply("Failed to fetch image");
		}
	},
};
