import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { evar } from "./var";
import { commands } from "./commands";

const client = new Client({
	intents:
		GatewayIntentBits.GuildMessages |
		GatewayIntentBits.Guilds |
		GatewayIntentBits.MessageContent,
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
});

client.once(Events.ClientReady, async () => {
	if (client.user !== null) {
		console.log(`Ready as ${client.user.tag}`);
		client.user.setActivity({
			name: "AIとお話し中",
			state: "aichatがトピックに含まれてるチャンネルでメッセージを送信",
			type: ActivityType.Custom,
			url: "https://neody.land",
		});
		setInterval(() => {
			client.user?.setActivity({
				name: "AIとお話し中",
				state: "aichatがトピックに含まれてるチャンネルでメッセージを送信",
				type: ActivityType.Custom,
				url: "https://neody.land",
			});
		}, 1000 * 60);
	}
	// set command
	await client.application!.commands.set(commands.map((x) => x.builder));
});

client.on(Events.MessageCreate, async (message) => {
	if (
		(!message.content.length && !message.attachments.size) ||
		message.author?.bot
	)
		return;
	if (!message.inGuild()) return;
});

client.on(Events.InteractionCreate, async (i) => {
	if (i.isChatInputCommand()) {
		const command = commands.find((x) => x.builder.name === i.commandName);
		if (!command) return;
		try {
			await command.execute(i);
		} catch (e: unknown) {
			console.error(e);
			const err = (e as Error).toString();
			if (i.deferred) i.followUp(err);
			else if (i.replied) i.editReply(err);
			else i.reply(err);
		}
	}
});

client.login(evar("DISCORD_TOKEN"));

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Expection at:", err);
});
