import { config } from "dotenv";
config();

export function evar(key: string) {
	const value = process.env[key];
	if (!value) throw new Error(`${key} not provided`);
	return value;
}

export function evarOptional(key: string) {
	return process.env[key];
}
