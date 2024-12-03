/* global chrome */
import { promptModelBase } from "../AI_functions/promptHandler";
import { v4 as uuidv4 } from "uuid";

// Create a reminder
export async function createReminder(content, timestring) {
  try {
    console.log("Creating reminder with:", { content, timestring });

    const systemPrompt = `
You are a time parser. Convert human-readable time descriptions into structured components.

Return ONLY a JSON object in this format:
{
  "type": "relative" | "absolute",
  "value": number,
  "unit": "minutes" | "hours" | "days",  // for relative time
  "date": "YYYY-MM-DD",  // for absolute time
  "time": "HH:mm"        // for absolute time
}

Examples:
"in 5 minutes" -> {"type": "relative", "value": 5, "unit": "minutes"}
"tomorrow at 3pm" -> {"type": "absolute", "date": "2024-03-19", "time": "15:00"}
"in 2 hours" -> {"type": "relative", "value": 2, "unit": "hours"}

DON'T ADD ANY COMMENTS OR ADDITIONAL TEXT.
`;

    const prompt = `Parse this time: "${timestring}"`;

    // Use promptHandler to get AI response
    const response = await promptModelBase(systemPrompt, prompt);
    console.log("Raw AI response:", response);

    const parsed = JSON.parse(response);
    console.log("Parsed response:", parsed);

    // Calculate the timestamp
    let timestamp;
    const now = Date.now();
    console.log("Current timestamp:", now);

    if (parsed.type === "relative") {
      console.log("Processing relative time with:", {
        value: parsed.value,
        unit: parsed.unit,
      });
      const msMultiplier = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
      };
      timestamp = now + parsed.value * msMultiplier[parsed.unit];
      console.log("Calculated relative timestamp:", timestamp);
    } else {
      console.log("Processing absolute time with:", {
        date: parsed.date,
        time: parsed.time,
      });
      timestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
      console.log("Calculated absolute timestamp:", timestamp);
    }

    return await saveReminder(content, timestamp);
  } catch (error) {
    console.error("Error creating reminder:", error);
    return false;
  }
}

// Manual reminder creation with direct date and time inputs
export async function createReminderManual(content, date, time) {
  try {
    console.log("Creating manual reminder with:", { content, date, time });

    const timestamp = new Date(`${date}T${time}`).getTime();
    console.log("Calculated timestamp:", timestamp);

    if (isNaN(timestamp)) {
      throw new Error("Invalid date or time format");
    }

    return await saveReminder(content, timestamp);
  } catch (error) {
    console.error("Error creating manual reminder:", error);
    return false;
  }
}

// Helper function to save reminder to storage and create alarm
async function saveReminder(content, timestamp) {
  try {
    const reminder = {
      id: uuidv4(),
      content,
      timestamp,
      notified: false,
    };

    // Get existing reminders
    const { reminders = [] } = await chrome.storage.local.get("reminders");

    // Add new reminder
    await chrome.storage.local.set({
      reminders: [...reminders, reminder],
    });

    // Create alarm
    await chrome.alarms.create(`reminder_${reminder.id}`, {
      when: timestamp,
    });

    return true;
  } catch (error) {
    console.error("Error saving reminder:", error);
    throw error; // Re-throw to be caught by the calling function
  }
}

// Get all reminders
export async function getReminders() {
  const { reminders = [] } = await chrome.storage.local.get("reminders");
  return reminders;
}

// Delete a reminder
export async function deleteReminder(id) {
  try {
    const { reminders = [] } = await chrome.storage.local.get("reminders");
    const updatedReminders = reminders.filter((r) => r.id !== id);

    await chrome.storage.local.set({ reminders: updatedReminders });
    await chrome.alarms.clear(`reminder_${id}`);

    return true;
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return false;
  }
}

// Check and show due reminders
export async function checkReminders() {
  const { reminders = [] } = await chrome.storage.local.get("reminders");
  const now = Date.now();

  for (const reminder of reminders) {
    if (!reminder.notified && reminder.timestamp <= now) {
      // Show notification
      chrome.notifications.create(`notification_${reminder.id}`, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icons/icon128.png"), // 128px icon for notifications
        title: "Reminder",
        message: reminder.content,
        buttons: [{ title: "Dismiss" }],
        requireInteraction: true,
      });

      // Mark as notified
      reminder.notified = true;
    }
  }

  // Update storage with notified reminders
  await chrome.storage.local.set({ reminders });
}

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith("reminder_")) {
    await checkReminders();
  }
});

// Listen for notification interaction
chrome.notifications.onButtonClicked.addListener(async (notificationId) => {
  if (notificationId.startsWith("notification_")) {
    const reminderId = notificationId.replace("notification_", "");
    await deleteReminder(reminderId);
    chrome.notifications.clear(notificationId);
  }
});
