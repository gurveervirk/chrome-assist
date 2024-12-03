/* global chrome */
// src/api/rewriteHandler.js

import { marked } from "marked";
import { loadSettings } from "./settingsStorage"; // Importing the settings functions
import { promptModel } from "./promptHandler"; // Importing the prompt handler

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
  reWriter = await ai.rewriter.create({
    tone: currentSettings.rewrite.tone,
    length: currentSettings.rewrite.length,
    format: currentSettings.rewrite.format,
    sharedContext: currentSettings.rewrite.context.trim(),
  });
};

// Function to prompt the model and get a response
const promptRewriteModel = async (prompt) => {
  console.log("Prompt: ", prompt);
  if (!prompt) throw new Error("Prompt is required");

  if (!ai || !ai.rewriter) {
    throw new Error("Rewrite API unavailable");
  }

  // const canRewrite = await ai.assistant.capabilities();
  // if (canRewrite.available === 'no') {
  //   throw new Error("AI writer is not supported");
  // }

  try {
    // Create or update the rewriter instance with new settings
    await createReWriter();

    // Get the rewriting response from the AI model
    const fullResponse = await reWriter.rewrite(prompt);

    return {
      sanitizedResponse: marked.parse(fullResponse),
    };
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

// Handler function for external use
export const handleRewrite = async (prompt) => {
  try {
    console.log("Prompt: ", prompt);
    const result = await promptRewriteModel(prompt);
    return result.sanitizedResponse;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
};

export const enhanceSearchQueries = async (query) => {
  try {
    const settings = await loadSettings();
    const { numQueries, prompt } = settings.search;
    const result = await promptModel(
      prompt.replace("numQueries", numQueries),
      query
    );
    return result;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
};
