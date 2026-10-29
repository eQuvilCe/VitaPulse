export type Lang = "ru" | "uz" | "en";

type Dict = Record<string, string>;

export const messages: Record<Lang, Dict> = {
  en: {
    sleep: "Sleep",
    water: "Water",
    steps: "Steps",
    calories: "Calories",
    habits: "Habits",
    coach: "Coach",
    log_sleep: "Log last night's sleep to get better advice.",
    sleep_more: "You slept less than you need. Try an earlier bedtime tonight.",
    drink_water: "You're behind on water. Have a glass now.",
    walk_more: "Take a short walk to catch up on steps.",
    finish_habits: "A few habits are still open today.",
    keep_going: "Great day so far. Keep it up!",
  },
  ru: {
    sleep: "Сон",
    water: "Вода",
    steps: "Шаги",
    calories: "Калории",
    habits: "Привычки",
    coach: "Коуч",
    log_sleep: "Запишите сон за прошлую ночь, чтобы получать лучшие советы.",
    sleep_more: "Вы спали меньше нормы. Попробуйте лечь пораньше.",
    drink_water: "Вы отстаёте по воде. Выпейте стакан сейчас.",
    walk_more: "Прогуляйтесь, чтобы догнать норму шагов.",
    finish_habits: "Сегодня остались невыполненные привычки.",
    keep_going: "Отличный день. Так держать!",
  },
  uz: {
    sleep: "Uyqu",
    water: "Suv",
    steps: "Qadamlar",
    calories: "Kaloriya",
    habits: "Odatlar",
    coach: "Murabbiy",
    log_sleep: "Yaxshiroq maslahat uchun kechagi uyqungizni kiriting.",
    sleep_more: "Siz me'yoridan kam uxladingiz. Bugun erta yoting.",
    drink_water: "Suv ichishda orqada qoldingiz. Hozir bir stakan iching.",
    walk_more: "Qadamlar me'yoriga yetish uchun sayr qiling.",
    finish_habits: "Bugun ba'zi odatlar hali bajarilmagan.",
    keep_going: "Ajoyib kun. Davom eting!",
  },
};

export function t(lang: Lang, key: string): string {
  return messages[lang][key] ?? messages.en[key] ?? key;
}
