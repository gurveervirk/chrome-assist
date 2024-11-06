// src/api/rewriteHandler.js

import { marked } from "marked";
import DOMPurify from "dompurify";
import { loadSettings } from "./settingsStorage"; // Importing the settings functions

let reWriter;

// Function to create a rewriter instance
const createReWriter = async () => {
  const currentSettings = await loadSettings();

  // Destroy previous rewriter instance if it exists
  if (reWriter) {
    reWriter.destroy();
    reWriter = null;
  }

  // Create a new rewriter instance with the updated settings
  reWriter = await window.ai.rewriter.create({
    tone: currentSettings.rewrite.tone,
    length: currentSettings.rewrite.length,
    format: currentSettings.rewrite.format,
    sharedContext: currentSettings.rewrite.context.trim(),
  });
};

// Function to prompt the model and get a response
const promptModel = async (prompt) => {
  if (!prompt) throw new Error("Prompt is required");

  if (!window.ai || !window.ai.rewriter) {
    throw new Error("Rewrite API unavailable");
  }

  const canRewrite = await window.ai.rewriter.capabilities();
  if (canRewrite.available === 'no') {
    throw new Error("AI writer is not supported");
  }

  try {
    // Create or update the rewriter instance with new settings
    await createReWriter();

    // Get the rewriting response from the AI model
    const fullResponse = await reWriter.rewrite(prompt);

    return {
      sanitizedResponse: DOMPurify.sanitize(marked.parse(fullResponse)),
    };
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

// Handler function for external use
export const handleRewrite = async (prompt) => {
  try {
    const result = await promptModel(prompt);
    return result.sanitizedResponse;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
};
