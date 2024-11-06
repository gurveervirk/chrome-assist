// src/api/writeHandler.js
import { marked } from "marked";
import DOMPurify from "dompurify";
import { loadSettings } from "./settingsStorage";

let writer;

export const createWriterSession = async (tone, length, format, context) => {
  if (writer) writer.destroy();
  writer = await window.ai.writer.create({ tone, length, format, sharedContext: context });
};

export const handleWrite = async (prompt) => {
  if (!prompt) throw new Error("Prompt is required");

  const storedSettings = await loadSettings();
  const { tone, length, format, context } = storedSettings.write;

  await createWriterSession(tone, length, format, context);

  const fullResponse = await writer.write(prompt);
  return DOMPurify.sanitize(marked.parse(fullResponse));
};
