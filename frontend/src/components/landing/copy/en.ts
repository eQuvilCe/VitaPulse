// Landing page copy. Every locale must provide the same keys (see `LandingCopy`).
const en = {
  units: { cm: "cm", kg: "kg", kcal: "kcal", yrs: "yrs" },
  nav: {
    features: "Features",
    plan: "Your numbers",
    login: "Log in",
    cta: "Free plan",
    menu: "Menu",
    close: "Close",
  },
  hero: {
    title: ["Eat well.", "Feel light."],
    lead: "A free AI plan for food and training, built around your body and goal.",
    cta: "Get your free plan",
    photo: "An athlete in a running vest sprints across a sunny stadium",
  },
  statement: {
    before: "A plan that",
    after: "fits your life",
    photo: "A bowl of fresh salad",
    text: "Tell us a little about yourself. Vita Health turns it into meals, workouts and a daily calorie target, then keeps adjusting as you go.",
    mock: { eaten: "eaten", of: "of {kcal}", dish: "Salad · {kcal} kcal", lost: "−4.8 kg" },
    features: [
      { tag: "01", title: "AI plan", text: "Calories, macros, a weekly menu with recipes and workouts for home or the gym." },
      { tag: "02", title: "Calorie scan", text: "Photograph your plate. The dish, calories and macros land in your diary in seconds." },
      { tag: "03", title: "Progress", text: "Weight trend, BMI scale, streaks and badges that keep you going." },
    ],
  },
  marquee: ["Eat well", "Move more", "Sleep deep"],
  quiz: {
    title: "Your numbers",
    lead: "Move the sliders. Your BMI, daily calories and a realistic date update as you go.",
    sex: "Sex",
    female: "Female",
    male: "Male",
    goal: "Goal",
    lose: "Lose",
    gain: "Gain",
    age: "Age",
    height: "Height",
    weight: "Weight",
    by: "By how much",
    bmi: "BMI",
    now: "now",
    target: "goal",
    healthy: "Healthy for your height: {min}–{max} kg",
    kcal: "kcal a day",
    maintenance: "{kcal} keeps your weight steady",
    forecast: "Forecast",
    by_date: "{change} kg by {date}",
    pace: { lose: "At a gentle 0.5 kg a week", gain: "At a steady 0.25 kg a week" },
    lowTarget: "That goal is below the healthy range, so the plan aims for its lower end.",
    categories: { under: "Underweight", normal: "Healthy", over: "Overweight", obese: "Obesity" },
    cta: "Get my plan",
    note: "Estimate by the Mifflin–St Jeor formula. Not medical advice.",
  },
  closing: {
    title: "Start today",
    cta: "Get your free plan",
  },
  footer: {
    disclaimer: "Not medical advice",
  },
};

type Shape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Shape<U>[]
    : { [K in keyof T]: Shape<T[K]> };

export type LandingCopy = Shape<typeof en>;

export default en;
