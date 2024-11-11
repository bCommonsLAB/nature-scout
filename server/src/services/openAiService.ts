import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { AiInstructions, ImageAnalysisResult } from '../types/types';
import { config } from './../config';
import OpenAI from 'openai';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
//import { buildZodSchema } from '../utils/schemaBuilder';

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
//const analyzeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/analyze-config.json'), 'utf-8'));


async function analyzeImageStructured(images: string[]): Promise<ImageAnalysisResult> {
  console.log(`Starte Bildanalyse für ${images.length} Bilder`);

  //const zSchema = buildZodSchema(analyzeConfig);
  
  const zSchema1 = z.object({
    "analyses": z.array(z.object({
      "standort": z.object({
        "hangneigung": z.enum(["eben", "leicht_geneigt", "steil", "weis nicht"])
          .describe("Hangneigung des Geländes"),
        "exposition": z.enum(["N", "NO", "O", "SO", "S", "SW", "W", "NW", "weis nicht"])
          .describe("Ausrichtung des Hanges"),
        "bodenfeuchtigkeit": z.enum(["trocken", "frisch", "feucht", "nass", "wasserzügig", "weis nicht"])
          .describe("Feuchtigkeit des Bodens")
      }),
      "pflanzenArten": z.array(
        z.object({
          "name": z.string().describe("Name der Pflanzenart in deutscher Sprache"),
          "häufigkeit": z.enum(["einzeln", "zerstreut", "häufig", "dominant"])
            .describe("Häufigkeit der Art im Bestand"),
          "istZeiger": z.boolean().optional()
            .describe("Ist die Art ein wichtiger Indikator?")
        })
      ).describe("Liste der erkannten Pflanzenarten mit Details"),
      "Vegetationsstruktur": z.object({
        "höhe": z.enum(["kurz", "mittel", "hoch"])
          .describe("Höhe des Hauptbestandes"),
        "dichte": z.enum(["dünn", "mittel", "dicht"])
          .describe("Dichte der Vegetation"),
        "deckung": z.enum(["offen", "mittel", "geschlossen"])
          .describe("Bodendeckung der Vegetation")
      }),
      "blühaspekte": z.object({
        "intensität": z.enum(["keine", "vereinzelt", "reich"])
          .describe("Intensität der Blüte"),
        "anzahlFarben": z.number()
          .int()
          .describe("Anzahl verschiedener Blütenfarben")
      }),
      "nutzung": z.object({
        "beweidung": z.boolean()
          .describe("Beweidungsspuren vorhanden"),
        "mahd": z.boolean()
          .describe("Mahdspuren vorhanden"),
        "düngung": z.boolean()
          .describe("Düngungsspuren vorhanden")
      }),
      "habitatTyp": z.enum([
        "Magerwiese",
        "Trockenrasen",
        "Fettwiese",
        "Magerweide",
        "Fettweide",
        "Niedermoor",
        "Hochmoor",
        "sonstiges"
      ]).describe("Klassifizierung des Habitattyps"),
      "schutzstatus": z.object({
        "gesetzlich": z.number()
          .int()
          .describe("Mit welcher Wahrscheinlichkeit in Prozent ist es ein Habitat, der im Naturschutzgesetz angeführt ist - Nass- und Feuchtflächen:Verlandungsbereiche von stehenden oder langsam fließenden Gewässern, Schilf-, Röhricht- und Großseggenbestände, Feucht- und Nasswiesen mit Seggen und Binsen, Moore, Auwälder, Sumpf- und Bruchwälder, Quellbereiche, Naturnahe und unverbaute Bach- und Flussabschnitte sowie Wassergräben inklusive der Ufervegetation. Bei Trockenstandorte: Trockenrasen, Felsensteppen, Lehmbrüche?"),
        "hochwertig": z.number()
          .int()
          .describe("Mit welcher Wahrscheinlichkeit in Prozent ist es ein ökologisch hochwertige Lebensraum, der nicht vom Gesetz erfasst ist: Magerwiese, Magerweide, Trockenrasen, Felsensteppen, Lehmbrüche?"),
        "standard": z.number()
          .int()
          .describe("Mit Welcher Wahrscheinlichkeit in Prozent ist es ein ökologisch nicht hochwertige Lebensraum, wie Fettwiese, Fettweide, Kunstrasen aller Art, Parkanlagen, Ruderalflächen, u. a. Standardlebensraum?")
      }),
      "bewertung": z.object({
        "artenreichtum": z.number()
          .int()
          .describe("Geschätzte Anzahl Arten pro 25m²"),
        "konfidenz": z.number()
          .int()
          .describe("Konfidenz der Habitatbestimmung in Prozent")
      }),
      "evidenz": z.object({
        "dafürSpricht": z.array(z.string())
          .describe("Merkmale, die für die Klassifizierung sprechen"),
        "dagegenSpricht": z.array(z.string())
          .describe("Merkmale, die gegen die Klassifizierung sprechen")
      }),
    }))
  });
  
  
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
      Du bist ein erfahrener Vegetationsökologe und sollst bei der Habitatanalyse unterstützen. Argumentiere wissenschaftlich fundiert und berücksichtige alle verfügbaren Indizien für eine möglichst präzise Einschätzung.
    `.trim();

    const Question = `
      Bitte analysiere das Habitat systematisch nach folgenden Kriterien:
      1. Erfasse die Standortbedingungen und deren Einfluss auf die Vegetation
      2. Identifiziere charakteristische Pflanzenarten und deren Häufigkeit
      3. Beschreibe die Vegetationsstruktur und -dynamik
      4. Dokumentiere Nutzungsspuren und deren Auswirkungen
      5. Leite daraus den wahrscheinlichen Habitattyp ab
      6. Bewerte die ökologische Qualität und Schutzwürdigkeit
      7. Führe unterstützende und widersprechende Merkmale auf
      8. Schätze die Konfidenz deiner Einordnung
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
      temperature: 0.5,
      response_format: zodResponseFormat(zSchema1, "structured_analysis"),
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
