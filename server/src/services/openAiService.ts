import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { AiInstructions, ImageAnalysisResult } from '../types/types';
import { config } from './../config';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openaiAxios: AxiosInstance = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
});


async function analyzeImageStructured(images: string[]): Promise<ImageAnalysisResult> {
  console.log(`Starte Bildanalyse für ${images.length} Bilder`);
  
  const zSchema = z.object({
    "analyses": z.array(z.object({
      "Pflanzen-Arten": z.array(z.string()).describe("Liste der erkannten Pflanzenarten"),
      "Vegetationshöhe": z.string().describe("Die Höhe der Vegetation: Kurz (<10cm) - Mittel (10-30cm) - Hoch (>30cm)"),
      "Vegetationsdichte": z.string().describe("Die Dichte der Vegetation: Dünn - Mittel - Dicht"),
      "Vegetationsstruktur": z.string().describe("Die Struktur der Vegetation: Offen (Bestand lücken aufweist - man sieht den Erdboden) - Mittel - Dicht(Bestand ist dicht und man sieht den Erdboden nicht)"),
      "Blühintensität": z.string().describe("Keine Blüten - Wenige Blüten - Viele Blüten"),
      "Habitat": z.string().describe("Ist es eines der folgenden Habitate? Entweder Magerwiese, Trockenrasen, Fettwiese, Magerweide, Fettweide, Niedermoor, Hochmoor, keines dieser Habitate?"),
      "Pros": z.string().optional().describe("Besondere Merkmale, die für dieses erkannte Habitat sprechen"),
      "Cons": z.string().optional().describe("Besondere Merkmale, die eher für einen anderen Habitat sprechen"),
      "Wahrscheinlichkeit": z.number().describe("Die Wahrscheinlichkeit, dass das Habitat richtig erkannt wurde")
    }))
  });
  /*
  const zSchema = z.object({
    "Habitat": z.string().describe("Die Beschreibung des Habitats"),
    "Pflanzen-Arten": z.array(z.string()).describe("Liste der erkannten Pflanzenarten"),
    "Besonderheiten": z.string().optional().describe("Besondere Merkmale oder Auffälligkeiten")
  })
  */

  try {
    // Alle Bilder in base64 konvertieren
    const imageContents = images.map(filename => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${fs.readFileSync(path.join('uploads', filename)).toString('base64')}`,
        detail: "high" as const
      }
    }));

    const systemInstruction = `
      Du bist ein Biologe und solltest mir helfen Habitate anhand von Bildern zu erkennen. 
      Du solltest sehr wissenschaftlich argumentieren.
    `.trim();

    const Question = `
    Um eine Aussage zu treffen:
    - Erkenne Indizien wie typische Pflanzenarten, Vegetationshöhe , Vegetationsdichte, Vegetationsstruktur,
      Blühintensität
    - Versuche aus diesen Indizien einen Habitattyp abzuleiten und verständlich zu erklären
    - Erkenne den Hapitatstyp: Entweder Magerwiese, Trockenrasen, Fettwiese, Magerweide, Niedermoor, Hochmoor, anderes Habitate.
    - Wenn du eine Aussage machst, erkläre bitte was dafür spricht
    - Aber auch was dagegen spricht
    Am Ende muss sich ein Mensch ein Bild machen, wie wahrscheinlich die Aussage ist.
  `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: systemInstruction 
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: Question
            },
            ...imageContents
          ],
        },
      ],
      response_format: zodResponseFormat(zSchema, "structured_analysis"),
      max_tokens: 2000,
    });

    const analysisResult: string | null = completion.choices[0].message.content; // Verwenden Sie die tatsächliche Eigenschaft
    if (analysisResult) {
      console.log("analysisResult",analysisResult);
    //const parsedResult = JSON.parse(analysisResult); // Falls die Antwort ein JSON-String ist
      return { analysis: analysisResult, error: undefined};
    } else {
      return { analysis: "Keine Analyse verfügbar.", error: undefined};
    }
  } catch (error: any) {
    console.error('Fehler bei der Bildanalyse:', error);
    return {analysis: "Analysefehler", error: `Die Analyse für ${images} ist fehlgeschlagen: ${error.message}`};
  }
}

async function analyzeImage(imagePath: string, question: string | undefined): Promise<ImageAnalysisResult> {
  console.log(`Starte Bildanalyse für: ${imagePath}`);
  const filename = path.basename(imagePath);
  if (!fs.existsSync(imagePath)) {
    console.error(`Fehler: Die Datei ${imagePath} existiert nicht.`);
    return {analysis: "Analysefehler", error: `Das Bild ${imagePath} wurde nicht gefunden.`};
  }
  
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question || "Was siehst du auf diesem Bild?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                "detail": "high"
              }
            }
          ],
        },
      ],
      max_tokens: 300,
    });
    if(response.choices[0].message.content) {
      return {analysis: response.choices[0].message.content, error: undefined};
    } else {
      return {analysis: "Keine Analyse verfügbar.", error: undefined};
    }
  } catch (error: any) {
    console.error('Fehler bei der Bildanalyse:', error);
    return {analysis: "Analysefehler", error: `Die Analyse für ${imagePath} ist fehlgeschlagen: ${error.message}`};
  }
}

async function transcribeAudio(filePath: string): Promise<string> {
  console.log(`Starte Transkription für Datei: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Fehler: Die Datei ${filePath} existiert nicht.`);
    return `[Transkriptionsfehler: Die Audiodatei ${filePath} wurde nicht gefunden.]`;
  }

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
  try {
      const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    form.append('file', fileStream, {
      filename: fileName,
      contentType: 'audio/mp3',
    });
    form.append('model', config.OPENAI_TRANSCRIPTION_MODEL);

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
      },
        timeout: 60000, // 60 seconds timeout
    });

    return response.data.text;
  } catch (error) {
      retries++;
      console.error(`Transkriptionsversuch ${retries} fehlgeschlagen:`, error);
      
      if (retries === maxRetries) {
        console.error('Alle Versuche fehlgeschlagen. Gebe Fehlermeldung zurück.');
        return `[Transkriptionsfehler: Die Transkription für ${filePath} ist nach ${maxRetries} Versuchen fehlgeschlagen. Bitte überprüfen Sie die Audiodatei und versuchen Sie es erneut.]`;
      }

      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // This line should never be reached, but TypeScript requires a return statement
  return `[Unerwarteter Transkriptionsfehler für ${filePath}]`;
}

async function getOpenAIAnalysis(transcript: string, instructions: AiInstructions): Promise<any> {
  try {
    const userPrompt = Object.entries(instructions)
    .filter(([key, value]) => key !== 'systemprompt')
    .map(([key, value]) => `${key}: ${value.instruction}`)
    .join('\n');

    const response = await openaiAxios.post('/chat/completions', {
      model: config.OPENAI_CHAT_MODEL,
      messages: [
        { role: "system", content: instructions.systemprompt.instruction },
        { role: "user", content: `Transkript: ${transcript}\n\nBitte beantworte folgende Fragen:\n${userPrompt}` }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing transcript:', axios.isAxiosError(error) ? error.response?.data : (error as Error).message);
    console.log("transcript",transcript);
    console.log("instructions",instructions);

    throw new Error('Failed to analyze transcript');
  }
}

export { transcribeAudio, getOpenAIAnalysis, analyzeImage, analyzeImageStructured };
