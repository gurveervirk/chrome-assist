/* global chrome */
import { searchHistory, clearAllHistory } from './browser_functions/history';
import { searchBookmarks } from './browser_functions/searchBookmarks';
import { searchTabs } from './browser_functions/tabs';
import { handleNavigation } from './browser_functions/navigation';
import { addToReadingList } from './browser_functions/readingList';
import { reopenLastClosedTab, toggleBionicReading, adjustFontSize, resetFontSize } from './browser_functions/misc';
import { createReminder } from './browser_functions/reminders';
import { toggleHighContrast } from './browser_functions/toggleContrast';
import { captureAndSaveScreenshot } from './browser_functions/screenshot';
import { promptModelBase } from './AI_functions/promptHandler';
import functionRegistry from './registry.json';

const functionHandlers = {
    searchHistory: searchHistory,
    searchBookmarks: searchBookmarks,
    searchTabs: searchTabs,
    handleNavigation: handleNavigation,
    addToReadingList: addToReadingList,
    reopenLastClosedTab: reopenLastClosedTab,
    toggleBionicReading: toggleBionicReading,
    adjustFontSize: adjustFontSize,
    resetFontSize: resetFontSize,
    createReminder: createReminder,
    toggleHighContrast: toggleHighContrast,
    captureAndSaveScreenshot: captureAndSaveScreenshot,
    clearAllHistory: clearAllHistory
};

export async function parseCommand(userInput) {
  try {
    const systemPrompt = `You are a function parser that matches user commands to available functions.
      Available functions:
      ${functionRegistry.map(func => `
        ${func.name}: ${func.description}
        Parameters: ${func.parameters.map(p => `${p.name} (${p.type}${p.required ? ', required' : ''})`).join(', ')}
        Examples: ${func.examples.join(', ')}
      `).join('\n')}

      Your job is to:
      1. Identify which function best matches the user's intent
      2. Extract any required parameters
      3. Return ONLY a JSON object in this format:
      {
        "functionName": "nameOfFunction",
        "parameters": {
          "paramName": "value"
        },
        "confidence": 0.8  // How confident you are in this match (0-1)
      }

      If no function matches well, return:
      { "functionName": null, "parameters": {}, "confidence": 0 }

      DO NOT ADD ANY COMMENTS
      `;

    // Send the user input to the model
    const prompt = `Parse this command: "${userInput}"`;
    const response = await promptModelBase(systemPrompt, prompt);

    console.log(systemPrompt + prompt);

    console.log("The response received is: ", response);

    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);

      // Validate the parsed response
      if (parsed.functionName && !functionRegistry.find(f => f.name === parsed.functionName)) {
        throw new Error(`Invalid function name: ${parsed.functionName}`);
      }

      const result = executeCommand(parsed);
      return result;
    } catch (e) {
      console.error('Error parsing model response:', e);
      return null;
    }

  } catch (error) {
    console.error('Error in command parsing:', error);
    return null;
  }
}

// Executor function to actually run the matched function
export async function executeCommand(parsed) {
  try {
    // Find the function in registry
    console.log(parsed);
    const funcDef = functionRegistry.find(f => f.name === parsed.functionName);
    if (!funcDef) {
      throw new Error(`Function ${parsed.functionName} not found`);
    }

    console.log("Function definition is: ", funcDef);

    // Get the handler from our map instead of window scope
    const handler = functionHandlers[funcDef.name];    
    if (!handler) {
      throw new Error(`Handler for ${funcDef.name} not found`);
    }

    console.log("Handler is: ", handler);

    // Execute the function with parsed parameters
    const result = await handler(...Object.values(parsed.parameters));

    console.log("Result is: ", result);
    if (result === true) {
      return "Done!";
    }

    return result;

  } catch (error) {
    console.error('Error executing command:', error);
    throw error;
  }
}