// src/api/summarizeHandler.js

import { marked } from "marked";
import DOMPurify from "dompurify";
import { loadSettings } from "./settingsStorage";

export const createSummarizationSession = async (type, format, length) => {
  const canSummarize = await window.ai.summarizer.capabilities();
  if (canSummarize.available === "no") {
    throw new Error("AI Summarization is not supported");
  }

  const session = await window.ai.summarizer.create({ type, format, length });
  if (canSummarize.available === "after-download") {
    await session.ready;
  }

  return session;
};

export const promptSummarizeModel = async (prompt) => {
  if (!prompt) throw new Error("Prompt is required");

  const storedSettings = await loadSettings();
  const { type, format, length } = storedSettings.summarize;

  const session = await createSummarizationSession(type, format, length);
  const fullResponse = await session.summarize(prompt);
  session.destroy();

  return DOMPurify.sanitize(marked.parse(fullResponse));
};
