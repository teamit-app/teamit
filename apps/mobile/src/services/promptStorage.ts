import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BUG_REPORT_PROMPT_DISMISSED_DATE: '@teamit/bug_report_prompt_dismissed_date',
};

function todayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const promptStorage = {
  shouldShowBugReportPrompt: async (): Promise<boolean> => {
    const dismissedDate = await AsyncStorage.getItem(KEYS.BUG_REPORT_PROMPT_DISMISSED_DATE);
    return dismissedDate !== todayString();
  },

  dismissBugReportPromptForToday: () =>
    AsyncStorage.setItem(KEYS.BUG_REPORT_PROMPT_DISMISSED_DATE, todayString()),
};
