import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const Welcome: React.FC = () => {
  const [metadata, setMetadata] = useState({
    gemeinde: '',
    flurname: '',
    erfassungsperson: ''
  });

  useEffect(() => {
    const savedMetadata = localStorage.getItem('habitatMetadata');
    if (savedMetadata) {
      setMetadata(JSON.parse(savedMetadata));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => {
      const newMetadata = { ...prev, [name]: value };
      localStorage.setItem('habitatMetadata', JSON.stringify(newMetadata));
      return newMetadata;
    });
  };

  return (
    <Alert>
      <AlertTitle>Willkommen zur Habitat-Bewertung</AlertTitle>
      <AlertDescription>
        <div className="space-y-4">
          <p className="mt-4">
            In diesem Frageassistent werden Sie gebeten, einige Merkmale eines Naturhabitats zu erfassen und mehrere Bilder hochzuladen. 
            Wir werden diese Bilder analysieren, um einzuschätzen, ob das Habitat schützenswert ist.
          </p>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Gemeinde:</label>
            <input
              type="text"
              name="gemeinde"
              value={metadata.gemeinde}
              onChange={handleChange}
              className="border rounded p-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Flurname (Volkskundliche Bezeichnung):</label>
            <input
              type="text"
              name="flurname"
              value={metadata.flurname}
              onChange={handleChange}
              className="border rounded p-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Name der Erfassungsperson:</label>
            <input
              type="text"
              name="erfassungsperson"
              value={metadata.erfassungsperson}
              onChange={handleChange}
              className="border rounded p-2"
            />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default Welcome;
