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
    photo: "A woman runs along a sunlit path through a pine forest",
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
    lead: "Three answers, instant result. Nothing is sent until you sign up.",
    sex: "Sex",
    female: "Female",
    male: "Male",
    age: "Age",
    height: "Height",
    weight: "Weight",
    goal: "Goal",
    lose: "Lose",
    gain: "Gain",
    by: "By how much",
    less: "Less",
    more: "More",
    bmi: "BMI",
    kcal: "Calories a day",
    weeks: "≈ {weeks} weeks to {weight} {unit}",
    empty: "Fill in age, height and weight to see your BMI and daily calories.",
    invalid: "Check the numbers: age 14–90, height 120–230 cm, weight 35–300 kg.",
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
