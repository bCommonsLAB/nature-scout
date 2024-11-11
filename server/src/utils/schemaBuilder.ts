import { z } from 'zod';

/*
const zSchema1 = z.object({
    "analyses": z.array(z.object({
      "standort": z.object({
        "hangneigung": z.enum(["eben", "leicht_geneigt", "steil"])
          .describe("Hangneigung des Geländes"),
        "exposition": z.enum(["N", "NO", "O", "SO", "S", "SW", "W", "NW"])
          .describe("Ausrichtung des Hanges"),
        "bodenfeuchtigkeit": z.enum(["trocken", "frisch", "feucht", "nass", "wasserzügig"])
          .describe("Feuchtigkeit des Bodens")
      }),
      "pflanzenArten": z.array(
        z.object({
          "name": z.string().describe("Name der Pflanzenart"),
          "häufigkeit": z.enum(["einzeln", "zerstreut", "häufig", "dominant"])
            .describe("Häufigkeit der Art im Bestand"),
          "istZeiger": z.boolean().optional()
            .describe("Ist die Art ein wichtiger Indikator?")
        })
      ).describe("Liste der erkannten Pflanzenarten mit Details"),
*/

export function buildZodSchema(config: any): z.ZodSchema {
  function convertToZod(obj: any): any {
    try {
       console.log("convertToZod: ", obj);
       if (obj.type === 'array') {
            console.log("obj.items: ", obj.items);
            return z.array(convertToZod(obj.items)).describe(obj.description || '');
        }
        
        if (obj.enum) {
            console.log("obj.enum: ", obj.enum);
            return z.enum(obj.enum).describe(obj.description || '');
        }
        
        if (obj.type === 'boolean') {
            return z.boolean().describe(obj.description || '');
        }
        
        if (obj.type === 'string') {
            console.log("obj.type === 'string': ", obj.description);
            return z.string().describe(obj.description || '');
        }
        
        if (obj.type === 'integer' || obj.type === 'number') {
            console.log("obj.type === 'integer' || obj.type === 'number': ", obj.description);
            let schema = z.number().int();
            return schema.describe(obj.description || '');
        }
        
        if (obj.properties) {
            console.log("obj.properties: ", obj.properties);
            const shape: Record<string, any> = {};
            for (const [key, value] of Object.entries(obj.properties)) {
                shape[key] = convertToZod(value);
            }
            console.log("shape: ", shape);
            return z.object(shape);
        }
    } catch (error) {
      console.error("Error in convertToZod: ", error);
      
    }
    return obj;
  }

  return z.object(convertToZod(config));
} 