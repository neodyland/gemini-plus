import type { Chat, ChatModel } from ".";
import { evar } from "../var";
import { parser } from "stream-json";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiKey = evar("GEMINI_KEY");

const ai = new GoogleGenerativeAI(geminiKey);

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
		const res = await ai
			.getGenerativeModel({ model: model })
			.generateContentStream(chat);
		for await (const chunk of res.stream) {
			yield {
				tokens: 0,
				content: chunk.text(),
			};
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
