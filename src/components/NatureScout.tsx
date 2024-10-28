import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import Welcome from './Welcome';
import GetImage from './GetImage';
import Summary from './Summary';
import UploadedImageList from './UploadedImageList';
import ImageAnalysis from './ImageAnalysis';
import { Bild } from '../types'

const schritte = ['Einführung', 'Bilder hochladen', 'Habitat bestimmen', 'Pflanzenarten bestimmen', 'Abschlussbewertung'];

const TEST_BILDER: Bild[] = [
  {
    imageKey: "Panorama",
    filename: "1729848929355.jpg",
    analyse: ""
  },
  {
    imageKey: "Detail1",
    filename: "1729848999915.jpg",
    analyse: ""
  },
  {
    imageKey: "Detail2",
    filename: "1729849045498.jpg",
    analyse: ""
  }
];

const NatureScout: React.FC = () => {
  const [aktiverSchritt, setAktiverSchritt] = useState(0);
  const [bilder, setBilder] = useState<Bild[]>([]);
  const [bewertung, setBewertung] = useState<string | null>(null);
  const [ladevorgang, setLadevorgang] = useState(false);

  const handleBildUpload = (imageKey: string, filename: string, analysis: string) => {
    const neuesBild: Bild = {
      imageKey: imageKey,
      filename: filename,
      analyse: analysis 
    };
    setBilder(prev => [...prev, neuesBild]);
  };
/*
  useEffect(() => {
    if (analysen.length === 3) {
      setBewertung("Mittlere Priorität");
    }
  }, [analysen]);
*/
  const handleWeiter = () => {
    setAktiverSchritt(prevSchritt => prevSchritt + 1);
  };

  const handleZurück = () => {
    setAktiverSchritt(prevSchritt => prevSchritt - 1);
  };

  const handlePDFDownload = () => {
    console.log("PDF-Download wurde angefordert");
    // Hier würde die tatsächliche PDF-Generierung und der Download implementiert werden
  };

  const renderSchrittInhalt = (schritt: number) => {
    switch (schritt) {
      case 0:
        return (
          <Welcome />
        );
      case 1:
        return(
          <div>
            <p>Habitat bestimmen</p>
            <div className="flex flex-wrap justify-center gap-4">
              <GetImage 
                imageTitle='Panorama' 
                anweisung='Laden Sie ein Panoramabild des gesamten Habitats hoch.' 
                onBildUpload={handleBildUpload}
              />
              <GetImage 
                imageTitle='Detail1' 
                anweisung='Laden Sie ein Detailbild des Habitats hoch.' 
                onBildUpload={handleBildUpload}
              />
              <GetImage 
                imageTitle='Detail2' 
                anweisung='Laden Sie ein weiteres Detailbild des Habitats hoch.' 
                onBildUpload={handleBildUpload}
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div>
            <p>Habitat bestimmen</p>
            <UploadedImageList bilder={bilder} />
            <ImageAnalysis 
              bilder={bilder} 
              onAnalysisComplete={(analysedBilder) => setBilder(analysedBilder)} 
            />
          </div>
        )
      case 3:
        return (
          <div>
            <p>Arten bestimmen</p>
          </div>
        )
      case 4:
        return (
          <div>s
            <Summary 
              bewertung={bewertung}
              handlePDFDownload={handlePDFDownload}
            />
          </div>
        );
      default:
        return 'Unbekannter Schritt';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <Progress value={(aktiverSchritt / (schritte.length - 1)) * 100} className="w-full" />
        <div className="flex justify-between mt-2">
          {schritte.map((label, index) => (
            <span key={label} className={`text-sm ${index === aktiverSchritt ? 'font-bold' : ''}`}>{label}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{schritte[aktiverSchritt]}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSchrittInhalt(aktiverSchritt)}
            </CardContent>
          </Card>
        </div>
        
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={handleZurück} disabled={aktiverSchritt === 0}>Zurück</Button>
        <Button onClick={handleWeiter} disabled={aktiverSchritt === schritte.length - 1}>Weiter</Button>
      </div>
    </div>
  );
};

export default NatureScout;
