// src/api/promptHandler.js

import { marked } from "marked";
import DOMPurify from "dompurify";
import { loadSettings } from "./settingsStorage";

let session;

export const createPromptSession = async (temperature, topK) => {
  if (session) session.destroy();
  session = await window.ai.languageModel.create({ temperature, topK });
};

export const promptModel = async (prompt) => {
  if (!prompt) throw new Error("Prompt is required");

  const storedSettings = await loadSettings();
  const { temperature, topK } = storedSettings.prompt;

  if (!session || JSON.stringify({ temperature, topK }) !== JSON.stringify(storedSettings.prompt)) {
    await createPromptSession(temperature, topK);
  }

  const fullResponse = await window.ai.languageModel.prompt(prompt, {
    temperature,
    topK,
  });

  return DOMPurify.sanitize(marked.parse(fullResponse));
};
