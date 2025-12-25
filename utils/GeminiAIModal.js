// utils/GeminiAIModal.js
export const sendMessage = async (inputPrompt) => {
  const res = await fetch("/api/ai/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: inputPrompt }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "AI request failed");

  return data; // { text: "..." }
};
