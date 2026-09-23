import { createHash } from "node:crypto";

export const sha256 = (content: string): string =>
	createHash("sha256").update(content).digest("hex");
