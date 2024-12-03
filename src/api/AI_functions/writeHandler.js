/* global chrome */
// src/api/writeHandler.js
import { marked } from "marked";
import { loadSettings } from "./settingsStorage";

let writer;

export const createWriterSession = async (tone, length, format, context) => {
  if (writer) writer.destroy();
  writer = await ai.writer.create({
    tone,
    length,
    format,
    sharedContext: context,
  });
};

export const handleWrite = async (
  prompt,
  chosenTone = null,
  chosenLength = null
) => {
  if (!prompt) throw new Error("Prompt is required");

  try {
    const storedSettings = await loadSettings();
    const { tone, length, format, context } = storedSettings.write;

    await createWriterSession(
      chosenTone === null ? tone : chosenTone,
      chosenLength === null ? length : chosenLength,
      format,
      context
    );

    const fullResponse = await writer.write(prompt);
    return marked.parse(fullResponse);
  } catch (error) {
    console.error("Error during writing process:", error);
    throw new Error("Failed to process the writing request.");
  }
};
