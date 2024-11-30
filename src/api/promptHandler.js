/* global chrome */
// src/api/promptHandler.js

import { marked } from "marked";
import { loadSettings } from "./settingsStorage";

let session;

export const createPromptSession = async (systemPrompt, temperature, topK) => {
  if (session) session.destroy();
  session = await ai.languageModel.create({
    systemPrompt: systemPrompt,
    temperature: temperature,
    topK: topK,
  });
};

export const promptModel = async (systemPrompt, prompt) => {
  if (!prompt) throw new Error("Prompt is required");

  const storedSettings = await loadSettings();
  const { temperature, topK } = storedSettings.prompt;

  if (
    !session ||
    JSON.stringify({ temperature, topK }) !==
      JSON.stringify(storedSettings.prompt)
  ) {
    await createPromptSession(systemPrompt, temperature, topK);
  }

  const fullResponse = await session.prompt(prompt, {
    temperature,
    topK,
  });

  session.destroy();

  return marked.parse(fullResponse);
};
