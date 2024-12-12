import type { Chat, ChatModel } from ".";
import { evar } from "../var";
import { parser } from "stream-json";

const geminiKey = evar("GEMINI_KEY");

async function* generateGeminiContent(
	chat: Chat[],
	model: string,
	system?: string,
) {
	const payload = {
		safetySettings: [
			"HARM_CATEGORY_SEXUALLY_EXPLICIT",
			"HARM_CATEGORY_DANGEROUS_CONTENT",
			"HARM_CATEGORY_HATE_SPEECH",
			"HARM_CATEGORY_HARASSMENT",
		].map((category) => ({
			category,
			threshold: "BLOCK_NONE",
		})),
		contents: chat.map((c) => ({
			role: c.role === "user" ? "user" : "model",
			parts: [
				{
					text: c.text,
				},
				...(c.attachment
					? [
							{
								inlineData: {
									mimeType: c.attachment.mime,
									data: c.attachment.data,
								},
							},
						]
					: []),
			],
		})),
		systemInstruction: system
			? {
					role: "model",
					parts: [
						{
							text: system,
						},
					],
				}
			: undefined,
	};
	try {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${geminiKey}`,
			{
				method: "POST",
				body: JSON.stringify(payload),
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		const parserStream = parser();
		if(res.body) {
			res.body.pipeTo(parserStream as any as WritableStream<Uint8Array>);
		}
		let isText = false;
		let text = "";
		let iscandidatesTokenCount = false;
		for await (const chunk of parserStream) {
			if (chunk.name === "keyValue" && chunk.value === "text") {
				isText = true;
			}
			if (isText && chunk.name === "stringValue") {
				isText = false;
				text = chunk.value;
			}
			if (chunk.name === "keyValue" && chunk.value === "candidatesTokenCount") {
				iscandidatesTokenCount = true;
			}
			if (iscandidatesTokenCount && chunk.name === "numberValue") {
				iscandidatesTokenCount = false;
				yield {
					tokens: Number(chunk.value),
					content: text,
				};
			}
			if (chunk.name.includes("Value")) {
				console.debug(chunk.name.slice(0, -5), chunk.value);
			}
		}
	} catch (e) {
		console.warn(e);
		throw new Error("Failed to connect to the server");
	}
}

export const gemini15Pro: ChatModel = {
	name: "Gemini 1.5 Pro",
	id: "gemini-1.5-pro",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-1.5-pro-latest", system);
	},
};

export const gemini15Flash: ChatModel = {
	name: "Gemini 1.5 Flash",
	id: "gemini-1.5-flash",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-1.5-flash-latest", system);
	},
};

export const gemini15FlashSmall: ChatModel = {
	name: "Gemini 1.5 Flash 8b",
	id: "gemini-1.5-flash-small",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-1.5-flash-8b-latest", system);
	},
};

export const gemini20Flash: ChatModel = {
	name: "Gemini 2.0 Flash",
	id: "gemini-2.0-flash",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-2.0-flash-exp", system);
	},
};
