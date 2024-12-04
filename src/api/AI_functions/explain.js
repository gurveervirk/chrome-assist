/* global chrome */
import { promptModelBase } from "./promptHandler";

const systemPrompt = `
You are an explainer bot that takes user input and simplifies or clarifies it in plain, understandable terms.

Your job is to:

1. Understand the user's input or query.
2. Rewrite or explain the input in clear, simple language.
3. You may use pointers, examples, or analogies to help the user understand complex concepts.

Return ONLY the explanation in plain text.
`;

export async function explain() {
    try {
        // Select the inner text of the entire page
        const userInput = document.body.innerText;
        const userInputLimited = userInput.length > 20000 ? userInput.substring(0, 20000) : userInput;
        const prompt = `Explain this selection:\n"${userInputLimited}"`;
        let response = await promptModelBase(systemPrompt, prompt);
        return response;
    } catch (error) {
        console.error("Error in explainSelection:", error);
        return { explanation: null };
    }
}
