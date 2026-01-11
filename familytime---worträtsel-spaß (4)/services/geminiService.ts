
import { GoogleGenAI, Type } from "@google/genai";
import { WordPair, GameType } from "../types";
import { FALLBACK_WORDS } from "../constants";

export const generateWordPair = async (
  categoryChoice: string = "Zufall", 
  gameType: GameType = GameType.IMPOSTOR,
  excludeWords: string[] = []
): Promise<WordPair> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const entropy = Math.random().toString(36).substring(7);
    const creativeVibes = ["wesentlich", "funktional", "konzeptionell", "abstrakt", "alltäglich"];
    const randomVibe = creativeVibes[Math.floor(Math.random() * creativeVibes.length)];

    const exclusionList = excludeWords.length > 0 ? `VERMEIDE DIESE WÖRTER: ${excludeWords.join(", ")}` : "";

    let systemPrompt = "";
    let userPrompt = "";

    if (gameType === GameType.FRAGEN_MIX) {
      systemPrompt = "Du bist ein extrem kreativer Spiele-Autor. Erstelle zwei unterschiedliche, aber perfekt vergleichbare Fragen.";
      userPrompt = `Generiere zwei Fragen (Deutsch), die ähnliche Antworten provozieren.
      KATEGORIE: ${categoryChoice}. VIBE: ${randomVibe}.
      ENTROPIE-TOKEN: ${entropy}.
      ${exclusionList}
      ANFORDERUNGEN: 'secretWord' ist Frage A, 'hintWord' ist Frage B.`;
    } else {
      const categoryPrompt = categoryChoice === "Zufall" 
        ? "Wähle eine spannende, bekannte Kategorie." 
        : `Nutze die Kategorie '${categoryChoice}'.`;

      systemPrompt = `Du bist ein brillanter Spiele-Designer. Generiere ein deutsches Wortpaar für ein Assoziationsspiel.
      
      ZIEL: Ein konkretes 'secretWord' und ein cleveres, assoziatives 'hintWord'.
      
      STRIKTE REGELN FÜR DAS HILFSWORT (hintWord):
      1. KEINE SYNONYME: Wenn das Wort 'Apfel' ist, darf das Hilfswort NICHT 'Birne', 'Obst' oder 'Frucht' sein.
      2. KONZEPTIONELLER ANSATZ: Wähle Wörter, die eine Eigenschaft, eine Funktion oder einen abstrakten Kontext beschreiben.
      3. EINFACH ABER GUT: Das Hilfswort soll dem Impostor helfen, vage zu bleiben, ohne das Wort direkt zu nennen.
      
      ${exclusionList}

      GUTE BEISPIELE (So sollst du es machen):
      - Secret: 'Spiegel' -> Hint: 'Physik' (Weil Lichtbrechung)
      - Secret: 'Spiegel' -> Hint: 'Sehen' (Weil Funktion)
      - Secret: 'Spiegel' -> Hint: 'Eitelkeit' (Weil Kontext)
      - Secret: 'Apfel' -> Hint: 'Sünde' (Kultureller Kontext)
      - Secret: 'Apfel' -> Hint: 'Gesund' (Eigenschaft)
      - Secret: 'Kaffee' -> Hint: 'Röstung' (Prozess)
      - Secret: 'Auto' -> Hint: 'Mobilität' (Konzept)
      - Secret: 'Sonne' -> Hint: 'Vitamin D' (Wirkung)

      SCHLECHTE BEISPIELE (NIEMALS SO):
      - 'Apfel' -> 'Birne' (Falsch, zu ähnlich)
      - 'Katze' -> 'Hund' (Falsch, zu ähnlich)
      - 'Auto' -> 'LKW' (Falsch, zu ähnlich)

      Antworte nur mit einem validen JSON-Objekt.`;

      userPrompt = `${categoryPrompt} 
      VIBE: ${randomVibe}.
      SEED: ${entropy}.

      ANFORDERUNGEN:
      - 'secretWord': Das konkrete Ding.
      - 'hintWord': Die kluge, einfache Assoziation (Konzept/Funktion).
      - Beide Wörter müssen KURZ (1 Wort) und auf DEUTSCH sein.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        temperature: 1.0,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            secretWord: { type: Type.STRING, description: "Das konkrete Wort" },
            hintWord: { type: Type.STRING, description: "Die kluge Assoziation" },
            category: { type: Type.STRING, description: "Die Unterkategorie" }
          },
          required: ["secretWord", "hintWord", "category"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      return {
        secretWord: data.secretWord.trim(),
        hintWord: data.hintWord ? data.hintWord.trim() : "",
        category: data.category.trim()
      };
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("AI Generation failed, using fallback:", error);
    const availableFallbacks = FALLBACK_WORDS.filter(w => !excludeWords.includes(w.secretWord));
    const pool = availableFallbacks.length > 0 ? availableFallbacks : FALLBACK_WORDS;
    const pair = pool[Math.floor(Math.random() * pool.length)];
    return {
      secretWord: pair.secretWord,
      hintWord: pair.hintWord,
      category: pair.category
    };
  }
};
