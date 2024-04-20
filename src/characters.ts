import {
	ChatInputCommandInteraction,
	StringSelectMenuBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ButtonInteraction,
	EmbedBuilder,
	StringSelectMenuInteraction,
	Message,
} from "discord.js";

import { resetChat, pushQueue } from "./queue";
import { characters } from "./data/characters";

export async function characterCommand(i: ChatInputCommandInteraction) {
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

	const menu = new StringSelectMenuBuilder()
		.setCustomId("characters-select")
		.setPlaceholder("キャラクターを選択")
		.addOptions(
			characters.map((x) => ({
				label: x.name,
				description: x.place,
				value: x.id,
			})),
		);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		menu,
	);

	const embed = new EmbedBuilder()
		.setTitle("AIキャラクターを招待")
		.setDescription("招待したいキャラクターを選択してください")
		.setImage("https://cdn.mikn.dev/bot-assets/gemini/AICharSplash.png")
		.setFooter({
			text: "DISCLAIMER: All characters are owned by their respective rights holders. Neody is not affiliated with these owners in any way.",
		})
		.setColor("#00ff00");

	await i.reply({ embeds: [embed], components: [row] });
}

export async function characterSelect(i: StringSelectMenuInteraction) {
	const menu = new StringSelectMenuBuilder()
		.setCustomId("characters-select")
		.setPlaceholder("キャラクターを選択")
		.addOptions(
			characters.map((x) => ({
				label: x.name,
				description: x.place,
				value: x.id,
			})),
		);

	const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		menu,
	);

	const character = characters.find((x) => x.id === i.values[0])!;

	const button = new ButtonBuilder()
		.setCustomId(`characters-select-${character.id}`)
		.setLabel("キャラクターを招待")
		.setEmoji("<:letter:1225442743417962556>")
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

	const embed = new EmbedBuilder()
		.setTitle(character.name)
		.setDescription(
			`${character.description}\n\n:warning: キャラクターを招待したら今までのAIチャットがリセットされます`,
		)
		.setImage(character.image)
		.setFooter({ text: character.copyright })
		.setColor("#00ff00");

	await i.update({ embeds: [embed], components: [row, menuRow] });
}

export async function characterInvite(i: ButtonInteraction) {
	const character = characters.find(
		(x: any) => x.id === i.customId.split("-")[2],
	)!;

	const preprompt = character.preprompt;

	const embed = new EmbedBuilder()
		.setTitle("キャラクター招待")
		.setDescription(
			`${character.name}がチャットに招待されました！\n\n:warning: キャラクターが言うことは全て作り話です！`,
		)
		.setImage(character.image)
		.setColor("#00ff00");

	await i.update({ embeds: [embed], components: [] });

	await resetChat(i.channelId);
	await pushQueue(i.message as Message<true>, preprompt, []);
}
