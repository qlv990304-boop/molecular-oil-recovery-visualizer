import { GoogleGenAI, Type } from "@google/genai";
import { ExplanationResponse } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateExplanationAndPrompt = async (topic: string): Promise<ExplanationResponse> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are an expert Scientific Simulation Engineer specializing in Enhanced Oil Recovery (EOR).
    Your goal is to explain the scientific topic and provide aesthetic parameters for a particle simulation.
  `;

  const prompt = `
    Analyze the topic: "${topic}".
    
    1. Explain the principle in Chinese (Markdown). Focus on the mechanisms of Wettability Alteration, Interfacial Tension Reduction, and Emulsification.
    2. Provide simulation parameters for the visual style (colors, general speed).
    
    Response JSON format:
    {
      "explanation": "string",
      "simulationParams": {
        "mechanism": "general", 
        "oilColor": "#hex (e.g. #2F1B1B for heavy oil)",
        "waterColor": "#hex (e.g. #E0F7FA)",
        "surfactantColor": "#hex (e.g. #FF5722)",
        "rockColor": "#hex (e.g. #3E3E3E)",
        "flowSpeed": number (1-10),
        "turbulence": number (0-1),
        "oilDensity": number (ignore, will be overridden),
        "surfactantDensity": number (ignore, will be overridden),
        "viscosity": number (0.1-0.9),
        "poreWidth": number (ignore, will be overridden)
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          simulationParams: {
            type: Type.OBJECT,
            properties: {
              mechanism: { type: Type.STRING },
              oilColor: { type: Type.STRING },
              waterColor: { type: Type.STRING },
              surfactantColor: { type: Type.STRING },
              rockColor: { type: Type.STRING },
              flowSpeed: { type: Type.NUMBER },
              turbulence: { type: Type.NUMBER },
              oilDensity: { type: Type.NUMBER },
              surfactantDensity: { type: Type.NUMBER },
              viscosity: { type: Type.NUMBER },
              poreWidth: { type: Type.NUMBER },
            },
            required: ["oilColor", "waterColor", "surfactantColor", "rockColor", "flowSpeed", "turbulence", "viscosity"]
          },
        },
        required: ["explanation", "simulationParams"],
      },
    },
  });

  const jsonText = response.text;
  if (!jsonText) {
    throw new Error("No response from text generation model.");
  }

  return JSON.parse(jsonText) as ExplanationResponse;
};

export const generateDiagram = async (visualPrompt: string): Promise<string> => {
   return ""; 
};