import {
	ChatInputCommandInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ModalSubmitInteraction,
} from "discord.js";
import { evar } from "./var";

const endpoint = evar("IMAGINE_ENDPOINT");

export async function imagineCommand(i: ChatInputCommandInteraction) {
	const count = i.options.getInteger("count") ?? 1;
	const pos = i.options.getString("positive", true);
	const neg = i.options.getString("negative") || undefined;
	const size = i.options.getInteger("size") ?? 1024;
	const seed = i.options.getInteger("seed") || undefined;
	const base = i.options.getAttachment("base")?.url;
	const fast = i.options.getBoolean("fast") ?? false;
	if (fast && base) {
		await i.reply("高速生成はimage to imageモードでは使用できません");
		return;
	}
	const params = new URLSearchParams({
		count: count.toString(),
		pos,
		size: size.toString(),
		fast: fast.toString(),
	});
	if (neg) {
		params.append("neg", neg);
	}
	if (seed) {
		params.append("seed", seed.toString());
	}
	try {
		await i.deferReply();
		const image = base
			? await fetch(base).then((res) => res.blob())
			: undefined;
		const body = new FormData();
		if (image)
			body.append(
				"file",
				new File([image], "image.png", { type: "image/png" }),
			);
		const res = await fetch(`${endpoint}/?${params.toString()}`, {
			body: image ? body : undefined,
			method: image ? "POST" : "GET",
		});
		const seed = res.headers.get("Seed") ?? "Unknown";
		const data = await res.arrayBuffer();
		await i.editReply({
			content: `Seed: ${seed}`,
			files: [
				{
					attachment: Buffer.from(data),
					name: "image.png",
				},
			],
			components:
				count === 1
					? [
							new ActionRowBuilder<ButtonBuilder>().addComponents(
								new ButtonBuilder()
									.setLabel("加工")
									.setStyle(ButtonStyle.Primary)
									.setCustomId("imagine-edit")
									.setEmoji("➕"),
							),
						]
					: undefined,
		});
	} catch {
		if (i.replied || i.deferred) {
			await i.editReply("エラーが発生しました");
			return;
		}
		await i.reply("エラーが発生しました");
	}
}

export async function editButtonPress(i: ButtonInteraction) {
	const modal = new ModalBuilder()
		.setTitle("画像を加工")
		.setCustomId("imagine-edit")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setPlaceholder("プロンプト")
					.setCustomId("pos")
					.setLabel("ポジティブプロンプト")
					.setStyle(TextInputStyle.Paragraph)
					.setRequired(true),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setPlaceholder("ネガティブプロンプト")
					.setLabel("ネガティブプロンプト")
					.setCustomId("neg")
					.setStyle(TextInputStyle.Paragraph)
					.setRequired(false),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setPlaceholder("サイズ")
					.setLabel("サイズ")
					.setCustomId("size")
					.setMaxLength(4)
					.setMinLength(1)
					.setStyle(TextInputStyle.Short)
					.setRequired(false),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setPlaceholder("シード")
					.setLabel("シード")
					.setCustomId("seed")
					.setMaxLength(8)
					.setMinLength(1)
					.setStyle(TextInputStyle.Short)
					.setRequired(false),
			),
		);
	return i.showModal(modal);
}

const maxSeed = 2 ** 32 - 1;

export async function editModalSubmit(i: ModalSubmitInteraction) {
	const pos = i.fields.getTextInputValue("pos");
	const neg = i.fields.getTextInputValue("neg") || undefined;
	const size = Number(i.fields.getTextInputValue("size") || "1024");
	const vSeed = i.fields.getTextInputValue("seed") || undefined;
	const seed = vSeed ? Number(vSeed) : undefined;
	if (size > 4096 || size < 0 || isNaN(size)) {
		await i.reply("サイズは0以上4096以下である必要があります");
		return;
	}
	if (seed && (seed < 0 || seed > maxSeed || isNaN(seed))) {
		await i.reply(`シードは0から${maxSeed}の間である必要があります`);
		return;
	}
	const params = new URLSearchParams({
		pos,
		size: size.toString(),
	});
	if (neg) {
		params.append("neg", neg);
	}
	if (seed) {
		params.append("seed", seed.toString());
	}
	const imageUrl = i.message?.attachments.first()?.url;
	if (!imageUrl) {
		await i.reply("画像が見つかりませんでした");
		return;
	}
	try {
		await i.deferReply();
		const image = await fetch(imageUrl).then((res) => res.blob());
		const body = new FormData();
		body.append("file", new File([image], "image.png", { type: "image/png" }));
		const res = await fetch(`${endpoint}/?${params.toString()}`, {
			body,
			method: "POST",
		});
		const seed = res.headers.get("Seed") ?? "Unknown";
		const data = await res.arrayBuffer();
		await i.editReply({
			content: `Seed: ${seed}`,
			files: [
				{
					attachment: Buffer.from(data),
					name: "image.png",
				},
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel("加工")
						.setStyle(ButtonStyle.Primary)
						.setCustomId("imagine-edit")
						.setEmoji("➕"),
				),
			],
		});
	} catch {
		if (i.replied || i.deferred) {
			await i.editReply("エラーが発生しました");
			return;
		}
		await i.reply("エラーが発生しました");
	}
}
