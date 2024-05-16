import type { Chat, ChatModel } from ".";
import { evar } from "../var";
import { request } from "undici";
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
					...(c.attachment
						? {
								inlineData: {
									mimeType: c.attachment.mime,
									data: c.attachment.data,
								},
							}
						: {}),
				},
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
		const res = await request(
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
		res.body.pipe(parserStream);
		let isText = false;
		let text = "";
		let iscandidatesTokenCount = false;
		for await (const chunk of parserStream.iterator()) {
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
		}
	} catch (e) {
		console.warn(e);
		throw new Error("Failed to connect to the server");
	}
}

export const geminiPro: ChatModel = {
	name: "Gemini 1.0 Pro",
	id: "gemini-1.0-pro",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-pro", system);
	},
};

export const geminiProVision: ChatModel = {
	name: "Gemini 1.0 Pro Vision",
	id: "gemini-pro-vision",
	async generate(chat, system) {
		return generateGeminiContent(chat, "gemini-pro-vision", system);
	},
};

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
		return generateGeminiContent(chat, "gemini-1.5-flash", system);
	},
};
