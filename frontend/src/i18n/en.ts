const en = {
  brand: {
    name: "Vita Health",
    home: "Vita Health home",
  },
  nav: {
    features: "Features",
    how: "How it works",
    dashboard: "Dashboard",
    faq: "FAQ",
    login: "Log in",
    start: "Start free",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  language: {
    label: "Language",
    en: "English",
    ru: "Русский",
  },
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    error: "Something went wrong",
  },
  units: {
    kcal: "kcal",
    kg: "kg",
    cm: "cm",
    g: "g",
  },
};

// Every locale must provide the same keys as English.
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
export type Dictionary = Shape<typeof en>;

export default en;
