// Local stand-ins for cabinet endpoints the backend has not shipped yet.
// Same formulas as the backend (Mifflin-St Jeor, activity factors), a small
// bilingual recipe and exercise bank, and browser storage for personal logs.

import type {
  Achievements,
  Activity,
  Badge,
  Bmi,
  BmiCategory,
  DailyTip,
  DayTotals,
  Exercise,
  GoalKind,
  Measurement,
  MeasurementInput,
  MealSlot,
  Place,
  Plan,
  PlanDay,
  PlanInput,
  PlanMeal,
  ProgressPhoto,
  Restriction,
  ShoppingItem,
  Workout,
  WorkoutLog,
  WeightTrend,
} from "./api-vita";

type L = { en: string; ru: string };
type Lang = keyof L;

const lang = (locale: string): Lang => (locale === "ru" ? "ru" : "en");

// ---------- Dates & storage ----------

export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the value just isn't kept.
  }
}

const KEYS = {
  planInput: "vh-plan-input",
  planSeed: "vh-plan-seed",
  planCreated: "vh-plan-created",
  measurements: "vh-measurements",
  photos: "vh-photos",
  workouts: "vh-workouts",
  scans: "vh-scans",
};

// ---------- Body formulas ----------

export const ACTIVITY_FACTORS: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };

export function bmr(weight: number, height: number, age: number, sex: "male" | "female"): number {
  return Math.round(10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161));
}

export function bmiValue(weight: number, height: number): number {
  const m = height / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 25) return "normal";
  if (value < 30) return "overweight";
  return "obese";
}

export function bmiFromPlan(plan: Plan, currentWeight?: number): Bmi {
  const { height_cm, weight_kg, goal, target_change_kg } = plan.input;
  const weight = currentWeight ?? weight_kg;
  const m2 = (height_cm / 100) ** 2;
  const target = goal === "maintain" ? null : weight_kg + (goal === "lose" ? -1 : 1) * target_change_kg;
  const value = bmiValue(weight, height_cm);
  return {
    height_cm,
    weight_kg: weight,
    bmi: value,
    category: bmiCategory(value),
    target_weight_kg: target,
    target_bmi: target ? bmiValue(target, height_cm) : null,
    healthy_min_kg: Math.round(18.5 * m2 * 10) / 10,
    healthy_max_kg: Math.round(24.9 * m2 * 10) / 10,
  };
}

// ---------- Ingredients & recipes ----------

type Cat = "produce" | "protein" | "grains" | "dairy" | "pantry";

const ING: Record<string, { n: L; cat: Cat; unit?: "ml" | "pcs" }> = {
  oats: { n: { en: "Rolled oats", ru: "Овсяные хлопья" }, cat: "grains" },
  yogurt: { n: { en: "Greek yogurt", ru: "Греческий йогурт" }, cat: "dairy" },
  berries: { n: { en: "Berries (fresh or frozen)", ru: "Ягоды (свежие или замороженные)" }, cat: "produce" },
  honey: { n: { en: "Honey", ru: "Мёд" }, cat: "pantry" },
  eggs: { n: { en: "Eggs", ru: "Яйца" }, cat: "protein", unit: "pcs" },
  spinach: { n: { en: "Spinach", ru: "Шпинат" }, cat: "produce" },
  tomato: { n: { en: "Tomatoes", ru: "Помидоры" }, cat: "produce" },
  bread: { n: { en: "Wholegrain bread", ru: "Цельнозерновой хлеб" }, cat: "grains" },
  buckwheat: { n: { en: "Buckwheat", ru: "Гречка" }, cat: "grains" },
  seeds: { n: { en: "Pumpkin seeds", ru: "Тыквенные семечки" }, cat: "pantry" },
  plantMilk: { n: { en: "Oat or soy milk", ru: "Овсяное или соевое молоко" }, cat: "dairy", unit: "ml" },
  cottage: { n: { en: "Cottage cheese 5%", ru: "Творог 5%" }, cat: "dairy" },
  riceFlour: { n: { en: "Rice flour", ru: "Рисовая мука" }, cat: "grains" },
  apple: { n: { en: "Apples", ru: "Яблоки" }, cat: "produce" },
  chia: { n: { en: "Chia seeds", ru: "Семена чиа" }, cat: "pantry" },
  mango: { n: { en: "Mango", ru: "Манго" }, cat: "produce" },
  chicken: { n: { en: "Chicken breast", ru: "Куриная грудка" }, cat: "protein" },
  quinoa: { n: { en: "Quinoa", ru: "Киноа" }, cat: "grains" },
  zucchini: { n: { en: "Zucchini", ru: "Кабачки" }, cat: "produce" },
  oil: { n: { en: "Olive oil", ru: "Оливковое масло" }, cat: "pantry", unit: "ml" },
  lentils: { n: { en: "Red lentils", ru: "Красная чечевица" }, cat: "grains" },
  carrot: { n: { en: "Carrots", ru: "Морковь" }, cat: "produce" },
  onion: { n: { en: "Onions", ru: "Лук" }, cat: "produce" },
  turkey: { n: { en: "Turkey fillet", ru: "Филе индейки" }, cat: "protein" },
  tortilla: { n: { en: "Wholegrain tortillas", ru: "Цельнозерновые лепёшки" }, cat: "grains", unit: "pcs" },
  lettuce: { n: { en: "Lettuce", ru: "Салат листовой" }, cat: "produce" },
  salmon: { n: { en: "Salmon fillet", ru: "Филе лосося" }, cat: "protein" },
  potato: { n: { en: "Potatoes", ru: "Картофель" }, cat: "produce" },
  cucumber: { n: { en: "Cucumbers", ru: "Огурцы" }, cat: "produce" },
  beef: { n: { en: "Lean beef", ru: "Постная говядина" }, cat: "protein" },
  cabbage: { n: { en: "Cabbage", ru: "Капуста" }, cat: "produce" },
  cod: { n: { en: "Cod fillet", ru: "Филе трески" }, cat: "protein" },
  rice: { n: { en: "Brown rice", ru: "Бурый рис" }, cat: "grains" },
  broccoli: { n: { en: "Broccoli", ru: "Брокколи" }, cat: "produce" },
  chickpeas: { n: { en: "Chickpeas (cooked)", ru: "Нут (варёный)" }, cat: "protein" },
  coconut: { n: { en: "Light coconut milk", ru: "Кокосовое молоко лайт" }, cat: "pantry", unit: "ml" },
  tofu: { n: { en: "Firm tofu", ru: "Тофу твёрдый" }, cat: "protein" },
  pepper: { n: { en: "Bell peppers", ru: "Болгарский перец" }, cat: "produce" },
  tamari: { n: { en: "Tamari or soy sauce", ru: "Соевый соус тамари" }, cat: "pantry", unit: "ml" },
  bulgur: { n: { en: "Bulgur", ru: "Булгур" }, cat: "grains" },
  turkeyMince: { n: { en: "Turkey mince", ru: "Фарш индейки" }, cat: "protein" },
  walnuts: { n: { en: "Walnuts", ru: "Грецкие орехи" }, cat: "pantry" },
  hummus: { n: { en: "Hummus", ru: "Хумус" }, cat: "pantry" },
  kefir: { n: { en: "Kefir 1%", ru: "Кефир 1%" }, cat: "dairy", unit: "ml" },
  banana: { n: { en: "Bananas", ru: "Бананы" }, cat: "produce", unit: "pcs" },
};

type Tag = "meat" | "pork" | "fish" | "dairy" | "egg" | "gluten" | "nuts";

type RecipeDef = {
  slot: MealSlot;
  name: L;
  kcal: number;
  p: number;
  c: number;
  f: number;
  minutes: number;
  tags: Tag[];
  ing: [keyof typeof ING, number][];
  steps: L[];
};

const RECIPES: RecipeDef[] = [
  {
    slot: "breakfast",
    name: { en: "Oatmeal with berries and yogurt", ru: "Овсянка с ягодами и йогуртом" },
    kcal: 430, p: 22, c: 65, f: 8, minutes: 10, tags: ["gluten", "dairy"],
    ing: [["oats", 60], ["yogurt", 150], ["berries", 100], ["honey", 10]],
    steps: [
      { en: "Cook the oats in 200 ml of water for 5 minutes.", ru: "Свари хлопья в 200 мл воды 5 минут." },
      { en: "Top with yogurt and berries.", ru: "Выложи сверху йогурт и ягоды." },
      { en: "Drizzle with honey.", ru: "Полей мёдом." },
    ],
  },
  {
    slot: "breakfast",
    name: { en: "Veggie omelette with wholegrain toast", ru: "Омлет с овощами и цельнозерновым тостом" },
    kcal: 400, p: 25, c: 25, f: 21, minutes: 12, tags: ["egg", "gluten"],
    ing: [["eggs", 3], ["spinach", 50], ["tomato", 100], ["bread", 40]],
    steps: [
      { en: "Whisk the eggs with a pinch of salt.", ru: "Взбей яйца со щепоткой соли." },
      { en: "Wilt the spinach and tomato in a non-stick pan, pour in the eggs.", ru: "Обжарь шпинат и помидор на антипригарной сковороде, залей яйцами." },
      { en: "Cook covered for 4 minutes, serve with toast.", ru: "Готовь под крышкой 4 минуты, подавай с тостом." },
    ],
  },
  {
    slot: "breakfast",
    name: { en: "Buckwheat porridge with berries and seeds", ru: "Гречневая каша с ягодами и семечками" },
    kcal: 400, p: 13, c: 66, f: 10, minutes: 15, tags: [],
    ing: [["buckwheat", 70], ["plantMilk", 150], ["berries", 100], ["seeds", 15]],
    steps: [
      { en: "Simmer the buckwheat in water for 12 minutes.", ru: "Вари гречку в воде 12 минут." },
      { en: "Stir in the warm plant milk.", ru: "Добавь тёплое растительное молоко." },
      { en: "Finish with berries and pumpkin seeds.", ru: "Сверху — ягоды и тыквенные семечки." },
    ],
  },
  {
    slot: "breakfast",
    name: { en: "Baked cottage cheese pancakes with apple", ru: "Запечённые сырники с яблоком" },
    kcal: 420, p: 36, c: 40, f: 12, minutes: 25, tags: ["dairy", "egg"],
    ing: [["cottage", 200], ["eggs", 1], ["riceFlour", 30], ["apple", 150]],
    steps: [
      { en: "Mix cottage cheese, egg and rice flour into a dough.", ru: "Смешай творог, яйцо и рисовую муку." },
      { en: "Shape small pancakes and bake at 190 °C for 18 minutes.", ru: "Сформуй сырники и запекай при 190 °C 18 минут." },
      { en: "Serve with sliced apple.", ru: "Подавай с нарезанным яблоком." },
    ],
  },
  {
    slot: "breakfast",
    name: { en: "Chia pudding with mango", ru: "Чиа-пудинг с манго" },
    kcal: 340, p: 9, c: 42, f: 15, minutes: 5, tags: [],
    ing: [["chia", 30], ["plantMilk", 200], ["mango", 120]],
    steps: [
      { en: "Stir chia seeds into the milk and leave overnight.", ru: "Смешай чиа с молоком и оставь на ночь." },
      { en: "Top with diced mango in the morning.", ru: "Утром добавь кубики манго." },
    ],
  },
  {
    slot: "lunch",
    name: { en: "Chicken and quinoa bowl with roasted zucchini", ru: "Боул с курицей, киноа и запечённым кабачком" },
    kcal: 560, p: 48, c: 48, f: 18, minutes: 30, tags: ["meat"],
    ing: [["chicken", 150], ["quinoa", 70], ["zucchini", 150], ["oil", 10]],
    steps: [
      { en: "Cook the quinoa in salted water for 15 minutes.", ru: "Отвари киноа в подсолённой воде 15 минут." },
      { en: "Roast zucchini and chicken with oil at 200 °C for 20 minutes.", ru: "Запеки кабачок и курицу с маслом при 200 °C 20 минут." },
      { en: "Slice and assemble the bowl.", ru: "Нарежь и собери боул." },
    ],
  },
  {
    slot: "lunch",
    name: { en: "Red lentil and vegetable stew", ru: "Рагу из красной чечевицы с овощами" },
    kcal: 450, p: 24, c: 65, f: 11, minutes: 30, tags: [],
    ing: [["lentils", 80], ["carrot", 100], ["tomato", 150], ["onion", 60], ["oil", 10]],
    steps: [
      { en: "Soften onion and carrot in oil.", ru: "Обжарь лук и морковь на масле до мягкости." },
      { en: "Add lentils, tomatoes and 400 ml water.", ru: "Добавь чечевицу, помидоры и 400 мл воды." },
      { en: "Simmer 20 minutes, season to taste.", ru: "Туши 20 минут, посоли по вкусу." },
    ],
  },
  {
    slot: "lunch",
    name: { en: "Turkey wrap with yogurt sauce", ru: "Ролл с индейкой и йогуртовым соусом" },
    kcal: 480, p: 40, c: 42, f: 14, minutes: 15, tags: ["meat", "gluten", "dairy"],
    ing: [["turkey", 120], ["tortilla", 1], ["lettuce", 40], ["tomato", 80], ["yogurt", 50]],
    steps: [
      { en: "Grill the turkey and slice thinly.", ru: "Обжарь индейку на гриле и нарежь тонко." },
      { en: "Spread yogurt over the tortilla, add lettuce and tomato.", ru: "Смажь лепёшку йогуртом, выложи салат и помидор." },
      { en: "Add turkey and roll tightly.", ru: "Добавь индейку и плотно сверни." },
    ],
  },
  {
    slot: "lunch",
    name: { en: "Salmon with baby potatoes and cucumber salad", ru: "Лосось с молодым картофелем и салатом из огурцов" },
    kcal: 600, p: 36, c: 38, f: 32, minutes: 30, tags: ["fish"],
    ing: [["salmon", 150], ["potato", 200], ["cucumber", 150], ["oil", 10]],
    steps: [
      { en: "Boil the potatoes for 18 minutes.", ru: "Отвари картофель 18 минут." },
      { en: "Bake the salmon at 200 °C for 12 minutes.", ru: "Запеки лосось при 200 °C 12 минут." },
      { en: "Toss cucumbers with oil and serve alongside.", ru: "Заправь огурцы маслом и подавай рядом." },
    ],
  },
  {
    slot: "lunch",
    name: { en: "Beef with buckwheat and cabbage salad", ru: "Говядина с гречкой и салатом из капусты" },
    kcal: 560, p: 40, c: 52, f: 18, minutes: 35, tags: ["meat"],
    ing: [["beef", 130], ["buckwheat", 70], ["cabbage", 150], ["oil", 5]],
    steps: [
      { en: "Cook buckwheat for 15 minutes.", ru: "Отвари гречку 15 минут." },
      { en: "Sear beef strips over high heat for 5 minutes.", ru: "Обжарь полоски говядины на сильном огне 5 минут." },
      { en: "Shred cabbage, dress with oil and lemon.", ru: "Нашинкуй капусту, заправь маслом и лимоном." },
    ],
  },
  {
    slot: "dinner",
    name: { en: "Baked cod with brown rice and broccoli", ru: "Запечённая треска с бурым рисом и брокколи" },
    kcal: 480, p: 42, c: 52, f: 10, minutes: 30, tags: ["fish"],
    ing: [["cod", 180], ["rice", 60], ["broccoli", 200], ["oil", 5]],
    steps: [
      { en: "Cook the rice for 25 minutes.", ru: "Вари рис 25 минут." },
      { en: "Bake cod with a little oil at 200 °C for 15 minutes.", ru: "Запеки треску с каплей масла при 200 °C 15 минут." },
      { en: "Steam broccoli for 5 minutes.", ru: "Приготовь брокколи на пару 5 минут." },
    ],
  },
  {
    slot: "dinner",
    name: { en: "Chickpea and spinach curry with rice", ru: "Карри из нута со шпинатом и рисом" },
    kcal: 520, p: 18, c: 75, f: 15, minutes: 25, tags: [],
    ing: [["chickpeas", 150], ["spinach", 100], ["coconut", 60], ["rice", 60], ["onion", 50]],
    steps: [
      { en: "Fry the onion with curry spices.", ru: "Обжарь лук со специями карри." },
      { en: "Add chickpeas and coconut milk, simmer 10 minutes.", ru: "Добавь нут и кокосовое молоко, туши 10 минут." },
      { en: "Stir in spinach, serve with rice.", ru: "Вмешай шпинат, подавай с рисом." },
    ],
  },
  {
    slot: "dinner",
    name: { en: "Tofu and vegetable stir-fry", ru: "Тофу с овощами в воке" },
    kcal: 520, p: 28, c: 55, f: 20, minutes: 20, tags: [],
    ing: [["tofu", 180], ["rice", 60], ["pepper", 150], ["broccoli", 100], ["tamari", 15], ["oil", 10]],
    steps: [
      { en: "Cook the rice.", ru: "Отвари рис." },
      { en: "Brown cubed tofu in oil, add vegetables for 5 minutes.", ru: "Обжарь кубики тофу, добавь овощи на 5 минут." },
      { en: "Season with tamari and serve over rice.", ru: "Заправь соусом и подавай с рисом." },
    ],
  },
  {
    slot: "dinner",
    name: { en: "Turkey meatballs in tomato sauce with bulgur", ru: "Тефтели из индейки в томатном соусе с булгуром" },
    kcal: 500, p: 40, c: 48, f: 14, minutes: 35, tags: ["meat", "gluten"],
    ing: [["turkeyMince", 150], ["bulgur", 60], ["tomato", 200], ["onion", 40]],
    steps: [
      { en: "Mix mince with grated onion, roll into balls.", ru: "Смешай фарш с тёртым луком, скатай тефтели." },
      { en: "Simmer in chopped tomatoes for 20 minutes.", ru: "Туши в рубленых помидорах 20 минут." },
      { en: "Cook the bulgur for 12 minutes and serve.", ru: "Свари булгур 12 минут и подавай." },
    ],
  },
  {
    slot: "snack",
    name: { en: "Greek yogurt with walnuts", ru: "Греческий йогурт с грецкими орехами" },
    kcal: 230, p: 15, c: 8, f: 15, minutes: 2, tags: ["dairy", "nuts"],
    ing: [["yogurt", 150], ["walnuts", 15]],
    steps: [{ en: "Top the yogurt with chopped walnuts.", ru: "Посыпь йогурт рублеными орехами." }],
  },
  {
    slot: "snack",
    name: { en: "Apple with pumpkin seeds", ru: "Яблоко с тыквенными семечками" },
    kcal: 200, p: 6, c: 26, f: 9, minutes: 2, tags: [],
    ing: [["apple", 180], ["seeds", 20]],
    steps: [{ en: "Slice the apple and sprinkle with seeds.", ru: "Нарежь яблоко и посыпь семечками." }],
  },
  {
    slot: "snack",
    name: { en: "Hummus with vegetable sticks", ru: "Хумус с овощными палочками" },
    kcal: 200, p: 6, c: 20, f: 10, minutes: 5, tags: [],
    ing: [["hummus", 60], ["carrot", 100], ["cucumber", 100]],
    steps: [{ en: "Cut carrot and cucumber into sticks, dip in hummus.", ru: "Нарежь морковь и огурец палочками, макай в хумус." }],
  },
  {
    slot: "snack",
    name: { en: "Kefir with a banana", ru: "Кефир с бананом" },
    kcal: 260, p: 9, c: 40, f: 6, minutes: 1, tags: ["dairy"],
    ing: [["kefir", 250], ["banana", 1]],
    steps: [{ en: "Enjoy as is or blend into a smoothie.", ru: "Ешь так или взбей в смузи." }],
  },
];

const EXCLUDES: Record<Restriction, Tag[]> = {
  vegetarian: ["meat", "pork", "fish"],
  vegan: ["meat", "pork", "fish", "dairy", "egg"],
  no_lactose: ["dairy"],
  no_gluten: ["gluten"],
  no_pork: ["pork"],
  no_nuts: ["nuts"],
  no_fish: ["fish"],
};

const SLOT_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

// ---------- Workouts ----------

type ExDef = { n: L; sets?: number; reps?: string; seconds?: number };
type WorkoutDef = { focus: Workout["focus"]; title: L; minutes: number; ex: ExDef[] };

const ex = (en: string, ru: string, rest: Omit<ExDef, "n"> = {}): ExDef => ({ n: { en, ru }, ...rest });

const WORKOUTS: Record<Place, Record<"fat_burn" | "strength", WorkoutDef>> = {
  home: {
    fat_burn: {
      focus: "fat_burn",
      title: { en: "Home fat-burn circuit", ru: "Жиросжигающий круг дома" },
      minutes: 30,
      ex: [
        ex("Jumping jacks", "Прыжки «звёздочка»", { seconds: 45 }),
        ex("Bodyweight squats", "Приседания", { sets: 3, reps: "15" }),
        ex("Push-ups (knees ok)", "Отжимания (можно с колен)", { sets: 3, reps: "10" }),
        ex("Mountain climbers", "Скалолаз", { seconds: 40 }),
        ex("Glute bridge", "Ягодичный мостик", { sets: 3, reps: "15" }),
        ex("Plank", "Планка", { seconds: 45 }),
      ],
    },
    strength: {
      focus: "strength",
      title: { en: "Home strength", ru: "Силовая дома" },
      minutes: 40,
      ex: [
        ex("Backpack squats", "Приседания с рюкзаком", { sets: 4, reps: "12–15" }),
        ex("Push-ups", "Отжимания", { sets: 4, reps: "8–12" }),
        ex("Reverse lunges", "Обратные выпады", { sets: 3, reps: "10 / leg" }),
        ex("Table rows", "Тяга к столу", { sets: 3, reps: "10" }),
        ex("Pike push-ups", "Отжимания «пайк»", { sets: 3, reps: "8" }),
        ex("Side plank", "Боковая планка", { seconds: 30 }),
      ],
    },
  },
  gym: {
    fat_burn: {
      focus: "fat_burn",
      title: { en: "Gym intervals", ru: "Интервалы в зале" },
      minutes: 40,
      ex: [
        ex("Treadmill intervals 1 min fast / 1 min easy", "Беговая дорожка: 1 мин быстро / 1 мин легко", { seconds: 1200 }),
        ex("Rowing machine", "Гребной тренажёр", { seconds: 600 }),
        ex("Kettlebell swings", "Махи гирей", { sets: 3, reps: "15" }),
        ex("Goblet squats", "Гоблет-приседания", { sets: 3, reps: "12" }),
      ],
    },
    strength: {
      focus: "strength",
      title: { en: "Gym strength", ru: "Силовая в зале" },
      minutes: 55,
      ex: [
        ex("Barbell squat", "Приседания со штангой", { sets: 4, reps: "8" }),
        ex("Bench press", "Жим лёжа", { sets: 4, reps: "8" }),
        ex("Lat pulldown", "Тяга верхнего блока", { sets: 3, reps: "10" }),
        ex("Romanian deadlift", "Румынская тяга", { sets: 3, reps: "10" }),
        ex("Dumbbell shoulder press", "Жим гантелей сидя", { sets: 3, reps: "10" }),
        ex("Plank", "Планка", { seconds: 60 }),
      ],
    },
  },
};

const MOBILITY: WorkoutDef = {
  focus: "mobility",
  title: { en: "Brisk walk and stretching", ru: "Быстрая прогулка и растяжка" },
  minutes: 40,
  ex: [ex("Brisk walk", "Быстрая ходьба", { seconds: 1800 }), ex("Full-body stretch", "Растяжка всего тела", { seconds: 600 })],
};

const REST: WorkoutDef = { focus: "rest", title: { en: "Rest day", ru: "День отдыха" }, minutes: 0, ex: [] };

const WEEK: Record<GoalKind, Array<"fat_burn" | "strength" | "mobility" | "rest">> = {
  lose: ["fat_burn", "strength", "mobility", "fat_burn", "strength", "mobility", "rest"],
  gain: ["strength", "mobility", "strength", "rest", "strength", "mobility", "rest"],
  maintain: ["strength", "fat_burn", "mobility", "strength", "fat_burn", "mobility", "rest"],
};

// ---------- Plan generation ----------

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtAmount(qty: number, unit: "g" | "ml" | "pcs", l: Lang): string {
  if (unit === "pcs") return `${Math.ceil(qty)} ${l === "ru" ? "шт" : "pcs"}`;
  const u = unit === "ml" ? (l === "ru" ? "мл" : "ml") : l === "ru" ? "г" : "g";
  if (qty >= 1000) return `${Math.round(qty / 100) / 10} ${unit === "ml" ? (l === "ru" ? "л" : "l") : l === "ru" ? "кг" : "kg"}`;
  return `${Math.round(qty / 10) * 10 || Math.round(qty)} ${u}`;
}

const CAT_NAMES: Record<Cat, L> = {
  produce: { en: "Fruit & vegetables", ru: "Овощи и фрукты" },
  protein: { en: "Meat, fish & protein", ru: "Мясо, рыба и белок" },
  grains: { en: "Grains & bread", ru: "Крупы и хлеб" },
  dairy: { en: "Dairy & alternatives", ru: "Молочное и замены" },
  pantry: { en: "Pantry", ru: "Бакалея" },
};

export function buildPlan(input: PlanInput, locale: string, seed = 0, createdAt = new Date().toISOString()): Plan {
  const l = lang(locale);
  const base = bmr(input.weight_kg, input.height_cm, input.age, input.sex);
  const tdee = Math.round(base * ACTIVITY_FACTORS[input.activity]);

  const now = new Date();
  const target = new Date(input.target_date);
  const weeks = Math.max(1, (target.getTime() - now.getTime()) / (7 * 864e5));
  const change = input.goal === "maintain" ? 0 : Math.abs(input.target_change_kg);
  const maxPace = input.goal === "lose" ? Math.min(1, input.weight_kg * 0.0075) : 0.5;
  const wanted = change / weeks;
  const pace = Math.min(wanted, maxPace);
  const sign = input.goal === "lose" ? -1 : input.goal === "gain" ? 1 : 0;
  const floor = input.sex === "male" ? 1500 : 1200;
  let calories = Math.round(tdee + (sign * pace * 7700) / 7);
  if (calories < floor) calories = floor;
  // The real pace after the calorie floor.
  const realPace = change ? Math.abs(((calories - tdee) * 7) / 7700) : 0;
  const forecastWeeks = realPace > 0 ? change / realPace : 0;
  const forecast = addDays(now, Math.round(forecastWeeks * 7));

  // Protein per kg, capped at 30% of calories so a big deficit still leaves room for carbs.
  const proteinPerKg = input.goal === "lose" ? 1.8 : input.goal === "gain" ? 1.7 : 1.4;
  const protein = Math.round(Math.min(proteinPerKg * input.weight_kg, (0.3 * calories) / 4));
  const fat = Math.round(Math.max(0.6 * input.weight_kg, (0.25 * calories) / 9));
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  const banned = new Set(input.restrictions.flatMap((r) => EXCLUDES[r] ?? []));
  const pool = (slot: MealSlot) => {
    const all = RECIPES.filter((r) => r.slot === slot);
    const ok = all.filter((r) => !r.tags.some((t) => banned.has(t)));
    return ok.length ? ok : all.filter((r) => r.tags.length === 0);
  };

  const shopping = new Map<string, number>();
  const offset = hash(`${seed}`);
  const menu: PlanDay[] = Array.from({ length: 7 }, (_, day) => ({
    day,
    meals: SLOTS.map((slot): PlanMeal => {
      const options = pool(slot);
      const r = options[(day + offset + SLOTS.indexOf(slot)) % options.length];
      const k = Math.min(2.5, Math.max(0.5, Math.round(((calories * SLOT_SHARE[slot]) / r.kcal) * 10) / 10));
      for (const [key, qty] of r.ing) shopping.set(key, (shopping.get(key) ?? 0) + qty * k);
      return {
        slot,
        name: r.name[l],
        calories: Math.round(r.kcal * k),
        protein_g: Math.round(r.p * k),
        carbs_g: Math.round(r.c * k),
        fat_g: Math.round(r.f * k),
        recipe: {
          minutes: r.minutes,
          ingredients: r.ing.map(([key, qty]) => `${ING[key].n[l]} — ${fmtAmount(qty * k, ING[key].unit ?? "g", l)}`),
          steps: r.steps.map((s) => s[l]),
        },
      };
    }),
  }));

  const shoppingList: ShoppingItem[] = Array.from(shopping, ([key, qty]) => ({
    name: ING[key].n[l],
    amount: fmtAmount(qty, ING[key].unit ?? "g", l),
    category: CAT_NAMES[ING[key].cat][l],
  })).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const light = input.activity === "sedentary";
  const workouts: Workout[] = WEEK[input.goal].map((focus, day) => {
    const def = focus === "rest" ? REST : focus === "mobility" ? MOBILITY : WORKOUTS[input.place][focus];
    return {
      day,
      focus: def.focus,
      title: def.title[l],
      minutes: light && def.minutes ? Math.round(def.minutes * 0.75) : def.minutes,
      exercises: def.ex.map(
        (e): Exercise => ({
          name: e.n[l],
          sets: e.sets ? (light ? Math.max(2, e.sets - 1) : e.sets) : undefined,
          reps: e.reps?.replace("leg", l === "ru" ? "ногу" : "leg"),
          seconds: e.seconds,
        }),
      ),
    };
  });

  return {
    input,
    created_at: createdAt,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    bmr: base,
    tdee,
    weekly_change_kg: Math.round(sign * realPace * 100) / 100,
    forecast_date: isoDay(change ? forecast : now),
    // Flag only when the forecast lands noticeably after the date the user asked for.
    pace_capped: change > 0 && forecast.getTime() - target.getTime() > 3 * 864e5,
    menu,
    shopping: shoppingList,
    workouts,
    source: "formula",
  };
}

export function loadPlan(locale: string): Plan | null {
  const input = read<PlanInput | null>(KEYS.planInput, null);
  if (!input) return null;
  return buildPlan(input, locale, read(KEYS.planSeed, 0), read(KEYS.planCreated, new Date().toISOString()));
}

export function savePlan(input: PlanInput, locale: string): Plan {
  const created = new Date().toISOString();
  write(KEYS.planInput, input);
  write(KEYS.planSeed, 0);
  write(KEYS.planCreated, created);
  return buildPlan(input, locale, 0, created);
}

export function rebuildPlan(locale: string, input?: PlanInput): Plan {
  const current = input ?? read<PlanInput | null>(KEYS.planInput, null);
  if (!current) throw new Error("No plan to rebuild");
  const seed = read(KEYS.planSeed, 0) + 1;
  const created = new Date().toISOString();
  write(KEYS.planInput, current);
  write(KEYS.planSeed, seed);
  write(KEYS.planCreated, created);
  return buildPlan(current, locale, seed, created);
}

// ---------- Coach ----------

const TIPS: L[] = [
  { en: "Build each plate around protein first: it keeps you full and protects muscle while you lose fat.", ru: "Начинай тарелку с белка: он дольше насыщает и сохраняет мышцы, пока уходит жир." },
  { en: "Drink a glass of water before every meal. Thirst is easy to mistake for hunger.", ru: "Выпивай стакан воды перед каждым приёмом пищи — жажду легко спутать с голодом." },
  { en: "Aim for 7–9 hours of sleep tonight. Short sleep raises appetite the next day.", ru: "Постарайся поспать 7–9 часов: недосып повышает аппетит на следующий день." },
  { en: "Half of your plate should be vegetables. Volume without many calories.", ru: "Половина тарелки — овощи: объём без лишних калорий." },
  { en: "A 10-minute walk after dinner helps steady blood sugar.", ru: "10 минут прогулки после ужина помогают выровнять сахар в крови." },
  { en: "Weigh yourself at the same time each morning and watch the weekly trend, not single days.", ru: "Взвешивайся утром в одно и то же время и смотри на недельный тренд, а не на отдельные дни." },
  { en: "Prep tomorrow's lunch tonight. Decisions made in advance are easier to keep.", ru: "Приготовь обед на завтра уже сегодня — заранее принятые решения легче соблюдать." },
  { en: "Strength training twice a week keeps your metabolism up while dieting.", ru: "Силовые дважды в неделю поддерживают обмен веществ на дефиците." },
  { en: "Missed a day? Just log the next meal. Consistency beats perfection.", ru: "Пропустил день? Просто запиши следующий приём пищи. Регулярность важнее идеала." },
  { en: "Slow down: put the fork down between bites. Fullness takes about 20 minutes to register.", ru: "Ешь медленнее, откладывай вилку между кусочками — сытость приходит примерно через 20 минут." },
];

export function dailyTip(locale: string): DailyTip {
  const d = new Date();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
  return { text: TIPS[dayOfYear % TIPS.length][lang(locale)] };
}

export function offlineReply(locale: string): string {
  return lang(locale) === "ru"
    ? "AI-коуч сейчас недоступен — сервер ещё не подключён. Пока загляни в свой план: там калории, меню и тренировки, рассчитанные по твоей анкете."
    : "The AI coach is offline right now: the server isn't connected yet. Meanwhile, your plan has calories, a menu and workouts based on your answers.";
}

// ---------- Personal logs ----------

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const measurements = {
  list: (): Measurement[] => read<Measurement[]>(KEYS.measurements, []).sort((a, b) => a.day.localeCompare(b.day)),
  add: (m: MeasurementInput): Measurement => {
    const row = { ...m, id: newId() };
    write(KEYS.measurements, [...read<Measurement[]>(KEYS.measurements, []).filter((r) => r.day !== m.day), row]);
    return row;
  },
};

export const workouts = {
  list: (): WorkoutLog[] => read<WorkoutLog[]>(KEYS.workouts, []).sort((a, b) => b.day.localeCompare(a.day)),
  add: (title: string, day: string): WorkoutLog => {
    const row = { id: newId(), day, title };
    write(KEYS.workouts, [...read<WorkoutLog[]>(KEYS.workouts, []), row]);
    return row;
  },
  remove: (id: WorkoutLog["id"]): void => write(KEYS.workouts, read<WorkoutLog[]>(KEYS.workouts, []).filter((r) => r.id !== id)),
};

// Photos stay in this browser only, downscaled so several fit in storage.
async function downscale(file: Blob, max = 720): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * k);
    canvas.height = Math.round(img.height * k);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const photos = {
  list: (): ProgressPhoto[] => read<ProgressPhoto[]>(KEYS.photos, []),
  add: async (file: Blob, kind: ProgressPhoto["kind"], day: string): Promise<ProgressPhoto> => {
    const row = { id: newId(), day, kind, url: await downscale(file) };
    const next = [...read<ProgressPhoto[]>(KEYS.photos, []), row];
    localStorage.setItem(KEYS.photos, JSON.stringify(next));
    return row;
  },
  remove: (id: ProgressPhoto["id"]): void => write(KEYS.photos, read<ProgressPhoto[]>(KEYS.photos, []).filter((p) => p.id !== id)),
};

export function noteScan(): void {
  write(KEYS.scans, read(KEYS.scans, 0) + 1);
}

// ---------- Achievements ----------

// Longest run of consecutive days (ending today or yesterday) present in `days`.
function currentStreak(days: Set<string>): number {
  let d = new Date();
  if (!days.has(isoDay(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(isoDay(d))) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

function longestStreak(days: string[]): number {
  const sorted = Array.from(new Set(days)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && isoDay(addDays(new Date(prev), 1)) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export function achievements(data: {
  totals: DayTotals[];
  trend: WeightTrend | null;
  workouts: WorkoutLog[];
  plan: Plan | null;
  water: { day: string; value: number }[];
}): Achievements {
  const diaryDays = data.totals.filter((t) => t.calories > 0).map((t) => t.day);
  const workoutDays = data.workouts.map((w) => w.day);
  const waterDays = data.water.filter((w) => w.value >= 2000).map((w) => w.day);
  const points = data.trend?.points ?? [];
  const moved = points.length > 1 ? Math.abs(points[points.length - 1].weight_kg - points[0].weight_kg) : 0;

  // A comeback is a logged day after a gap of three or more days.
  const sortedDiary = Array.from(new Set(diaryDays)).sort();
  const comeback = sortedDiary.some((d, i) => i > 0 && (new Date(d).getTime() - new Date(sortedDiary[i - 1]).getTime()) / 864e5 >= 4);

  const scans = read(KEYS.scans, 0);
  const badge = (code: Badge["code"], progress: number, target: number): Badge => ({
    code,
    progress: Math.min(progress, target),
    target,
    earned_at: progress >= target ? "local" : null,
  });

  return {
    badges: [
      badge("first_plan", data.plan ? 1 : 0, 1),
      badge("first_scan", scans, 1),
      badge("diary_7", longestStreak(diaryDays), 7),
      badge("weight_1", Math.floor(moved * 10) / 10, 1),
      badge("weight_5", Math.floor(moved * 10) / 10, 5),
      badge("weight_10", Math.floor(moved * 10) / 10, 10),
      badge("workouts_10", data.workouts.length, 10),
      badge("water_week", longestStreak(waterDays), 7),
      badge("comeback", comeback ? 1 : 0, 1),
    ],
    streaks: {
      diary_days: currentStreak(new Set(diaryDays)),
      workout_days: currentStreak(new Set(workoutDays)),
      water_days: currentStreak(new Set(waterDays)),
    },
  };
}
