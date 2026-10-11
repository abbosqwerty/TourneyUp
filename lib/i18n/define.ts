/**
 * Every namespace is written once per locale. Uzbek is the source of truth for
 * the shape; Russian and English must provide exactly the same keys, so a
 * missing translation is a type error instead of a blank on the page.
 * Values are strings, or functions for text with numbers/names in it
 * (plural rules differ: "1 участник" / "5 участников").
 */
export type Shape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => string
      ? (...args: A) => string
      : Shape<T[K]>
}

export function defineMessages<T>(messages: { uz: T; ru: Shape<T>; en: Shape<T> }) {
  return messages as { uz: Shape<T>; ru: Shape<T>; en: Shape<T> }
}
