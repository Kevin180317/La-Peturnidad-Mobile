// Largo máximo de lo que se escribe en la app (se aplica con maxLength en cada campo)
export const LIMITS = {
  name: 50,
  email: 254,
  password: 72,
  petName: 40,
  petColor: 30,
  petFeatures: 500,
  title: 100,
  description: 2000,
  groupName: 60,
  message: 2000,
  comment: 500,
  search: 60,
} as const;
