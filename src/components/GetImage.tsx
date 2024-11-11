import React, { useState } from 'react';
import { Upload } from 'lucide-react'; // Stellen Sie sicher, dass Sie das richtige Icon importieren
import { Progress } from './ui/progress';
import axios from 'axios'; // Sie müssen axios installieren: npm install axios

interface GetImageProps {
  imageTitle: string;
  anweisung: string;
  onBildUpload: (imageTitle: string, filename: string, analysis: string) => void;
}

const GetImage: React.FC<GetImageProps> = ({ imageTitle, anweisung, onBildUpload }) => {
  const [ladevorgang, setLadevorgang] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [bildAnalyse, setBildAnalyse] = useState<string>('');

  const handleBildUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('image', file);
    setLadevorgang(true);

    try {
      const uploadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Bild hochgeladen:', uploadResponse.data);

      const imageUrl = `${process.env.REACT_APP_API_URL}/getimage/${uploadResponse.data.filename}`;
      setUploadedImage(imageUrl);
      /*
      // Analyse des Bildes
      const analyzeResponse = await axios.post(`${process.env.REACT_APP_API_URL}/analyze`, {
        filename: uploadResponse.data.filename,
        question: 'Welches Habitat, welche Pflanzenarten und welche Besonderheiten kann man auf dem Bild genau erkennen?',
        schema: customSchema
      });

      console.log('Bildanalyse:', analyzeResponse.data);
      setBildAnalyse(analyzeResponse.data.analysis);
      onBildUpload(imageTitle, uploadResponse.data.filename, analyzeResponse.data.analysis);
      */
      onBildUpload(imageTitle, uploadResponse.data.filename, "");
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      setBildAnalyse('Fehler bei der Bildanalyse');
    } finally {
      setLadevorgang(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-64 min-h-64 border-2 border-gray-300 rounded-lg bg-gray-50 p-4 space-y-2">
      <h2 className="text-lg font-semibold">{imageTitle} Upload</h2>
      <p className="text-sm text-center">
        {anweisung}
      </p>
      <div 
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200" 
        style={{ backgroundImage: uploadedImage ? `url(${uploadedImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <label htmlFor={`dropzone-file-${imageTitle}`} className="flex flex-col items-center justify-center w-full h-full">
          {ladevorgang ? (
            <Progress value={33} className="w-full" />
          ) : !uploadedImage ? (
            <>
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="text-xs text-gray-500">Klicken Sie zum Hochladen oder ziehen Sie die Datei hierher</p>
              <p className="text-xs text-gray-500">PNG, JPG oder GIF (MAX. 800x400px)</p>
            </>
          ) : null}
          <input id={`dropzone-file-${imageTitle}`} type="file" className="hidden" onChange={handleBildUpload} />
        </label>
      </div>
      {uploadedImage && bildAnalyse && (
        <div className="mt-4 w-full">
          <h3 className="text-md font-semibold mb-2">Bildanalyse:</h3>
          <p className="text-sm text-gray-600">{bildAnalyse}</p>
        </div>
      )}
    </div>
  );
};

export default GetImage;
