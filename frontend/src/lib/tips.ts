// Coach tip codes from the API mapped to readable text (ru/uz copies come with the i18n work).
export const TIP_TEXT: Record<string, string> = {
  log_sleep: "Log last night's sleep to get a better picture of your recovery.",
  sleep_more: "You slept less than planned. Try an earlier bedtime tonight.",
  drink_water: "Water is running low today. Have a glass now.",
  walk_more: "Quiet day so far. A short walk will get your steps moving.",
  finish_habits: "A few habits are still open for today.",
  keep_going: "Everything is on track. Keep going!",
};

export function tipText(code: string): string {
  return TIP_TEXT[code] ?? code;
}
