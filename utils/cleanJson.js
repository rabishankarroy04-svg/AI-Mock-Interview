export const cleanJson = (text) => {
  if (!text) return "";

  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
};
