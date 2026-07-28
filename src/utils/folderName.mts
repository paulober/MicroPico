export function isValidFolderName(name: string): boolean {
  // Check for invalid characters and reserved names
  const invalidChars = /[<>:"/\\|?*]/;
  const reservedNames = ["CON", "PRN", "AUX", "NUL", "LPT", "COM"];

  if (invalidChars.test(name)) {
    return false;
  }

  // test for controll characters (ASCII 0–31)
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) < 32) {
      return false;
    }
  }

  const upperName = name.toUpperCase();
  if (
    reservedNames.includes(upperName) ||
    /^(COM[1-9]|LPT[1-9])$/.test(upperName)
  ) {
    return false;
  }

  return true;
}
