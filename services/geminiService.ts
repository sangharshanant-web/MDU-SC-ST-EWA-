import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDraftMessage = async (
  topic: string,
  tone: 'formal' | 'urgent' | 'friendly',
  details: string
): Promise<string> => {
  try {
    const prompt = `
      You are the General Secretary of the 'MDU SC/ST EWA' association.
      Write a ${tone} message regarding: ${topic}.
      
      Details to include: ${details}.
      
      The message should be suitable for sending via WhatsApp or SMS. 
      Keep it concise, clear, and professional. 
      Do not include placeholders like "[Your Name]" at the end, sign it as "General Secretary, MDU SC/ST EWA".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate message.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Error: Unable to connect to AI service to draft message.";
  }
};

export const generateVideoScript = async (
  topic: string,
  details: string
): Promise<string> => {
  try {
    const prompt = `
      Write a short script (approx 30-60 seconds) for a video message from the General Secretary of MDU SC/ST EWA.
      Topic: ${topic}
      Details: ${details}
      
      Structure it with:
      1. Opening (Greeting)
      2. Main Body (The update/request)
      3. Closing (Call to action)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate script.";
  } catch (error) {
    console.error("Error generating script:", error);
    return "Error: Unable to connect to AI service.";
  }
};

export const askSCSTLawBot = async (
  userQuestion: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  try {
    // Construct the contents array from history and new question
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    
    // Add the new user question
    contents.push({
      role: 'user',
      parts: [{ text: userQuestion }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a highly advanced AI Legal & Administrative Consultant for the 'MDU SC/ST EWA' (Madurai Division SC/ST Employees Welfare Association).
        
        YOUR CORE EXPERTISE:
        1. SC/ST Rights: SC/ST (Prevention of Atrocities) Act 1989, Protection of Civil Rights Act 1955, and Article 16(4), 16(4A), 335 of the Constitution.
        2. Railway Rules: Indian Railway Establishment Code (IREC), Manual (IREM), Discipline & Appeal Rules (D&AR) 1968, and Railway Conduct Rules.
        3. Reservation Policy: Post-based rosters, reservation in promotion, carrying forward of vacancies, and DoPT Office Memorandums.
        4. GST & Taxation: Central Goods and Services Tax (CGST) Act, SGST, IGST, GST registration limits for associations, tax rates on subscriptions, exemptions, and filing procedures.
        5. Drafting: You are an expert drafter. When asked, draft professional representations, appeal letters, show-cause notice replies, RTI applications, or tax-related queries.

        INSTRUCTIONS:
        1. Language: Detect the user's language (English, Tamil, Hindi, etc.) and reply in the EXACT SAME language.
        2. Search: Use Google Search to find the latest Supreme Court judgments, Railway Board Circulars, DoPT orders, or GST Council notifications if the user asks for recent info.
        3. Style: Be authoritative yet helpful. 
        4. Formatting: Do NOT use Markdown (bold/italic) as the output will be read by Text-to-Speech. Use clear paragraph breaks.
        
        Example Interaction:
        User: "Is GST applicable on association monthly subscription?"
        You: "Under the GST Act, if the aggregate turnover of the association exceeds the prescribed limit (e.g., Rs. 20 Lakhs), registration is mandatory. However, specific exemptions exist based on the contribution amount per member (e.g., up to Rs. 7500 per month for RWA). For employee welfare associations, the specifics depend on..."
        `,
      }
    });

    let finalText = response.text || "I apologize, I could not generate a response at this time.";

    // Append Grounding Sources (URLs) if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => uri) // Filter out undefined/null
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Unique

      if (sources.length > 0) {
        finalText += "\n\nSources:\n" + sources.join("\n");
      }
    }

    return finalText;
  } catch (error) {
    console.error("Error querying Legal Bot:", error);
    return "Sorry, I am having trouble connecting to the server. Please check your internet connection and try again.";
  }
};