// src/api/summarizeHandler.js

import { marked } from "marked";
import DOMPurify from "dompurify";
import { loadSettings } from "./settingsStorage";
import { promptModel }  from "./promptHandler";

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

export const promptSummarizeModel = async (prompt, forBookmark) => {
  if (!prompt) throw new Error("Prompt is required");

  if (forBookmark) {
    let title = '';
    let keywords = '';
    let tldr = '';
  
    try {
      const storedSettings = await loadSettings();
      const { titlePrompt, keywordsPrompt, type, format, length, numKeywords } = storedSettings.bookmark;
  
      const summarizeChunk = async (text) => {
        let session;
        try {
          session = await createSummarizationSession(type, format, length);
          const response = await session.summarize(text);
          session.destroy();
          return response;
        } catch (error) {
          console.error("Error during summarization:", error);
          session?.destroy();
          throw error;
        }
      };
  
      const chunkSize = 2500;
      let chunks = [];
      for (let i = 0; i < prompt.length; i += chunkSize) {
        chunks.push(prompt.slice(i, i + chunkSize));
      }
  
      let chunkIndex = 0;
  
      // Iterate over chunks to get title, keywords, and tldr
      while (chunkIndex < chunks.length) {
        try {
          // Try to generate the title
          if (!title) {
            title = await promptModel(titlePrompt, chunks[chunkIndex]);
            console.log("Title: ", title);
          }
  
          // Try to generate the keywords
          if (!keywords) {
            keywords = await promptModel(keywordsPrompt.replace('numKeywords', numKeywords), chunks[chunkIndex]);
            console.log("Keywords: ", keywords);
          }
  
          // Try to generate the tldr (summary)
          if (!tldr) {
            tldr = await summarizeChunk(chunks[chunkIndex]);
            console.log("Summary: ", tldr);
          }
  
          // If all are populated, break out of the loop
          if (title && keywords && tldr) {
            break;
          }
        } catch (error) {
          console.error("Error during processing chunk:", error);
  
          // If there's an error, move to the next chunk
          chunkIndex++;
        }
      }
  
      return {
        title: title,
        keywords: keywords,
        tldr: tldr
      };
    } catch (error) {
      console.error("Error during summarization (complete failure):", error);
      return {
        title: '',
        keywords: '',
        tldr: ''
      };
    }
  }  

  const storedSettings = await loadSettings();
  const { type, format, length } = storedSettings.summarize;

  const summarizeChunk = async (text) => {
    const session = await createSummarizationSession(type, format, length);
    const response = await session.summarize(text);
    session.destroy();
    return response;
  };

  const chunkSize = 4000;
  let chunks = [];
  for (let i = 0; i < prompt.length; i += chunkSize) {
    chunks.push(prompt.slice(i, i + chunkSize));
  }

  let summaries = [];
  for (const chunk of chunks) {
    summaries.push(await summarizeChunk(chunk));
  }

  let combinedSummary = summaries.join(" ");
  while (combinedSummary.length > chunkSize) {
    chunks = [];
    for (let i = 0; i < combinedSummary.length; i += chunkSize) {
      chunks.push(combinedSummary.slice(i, i + chunkSize));
    }

    summaries = [];
    for (const chunk of chunks) {
      summaries.push(await summarizeChunk(chunk));
    }

    combinedSummary = summaries.join(" ");
  }

  return DOMPurify.sanitize(marked.parse(combinedSummary));
};