import React from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { FileDown } from 'lucide-react';

interface SummaryProps {
  bewertung: string | null;
  handlePDFDownload: () => void;
}

const Summary: React.FC<SummaryProps> = ({ bewertung, handlePDFDownload }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Bewertungsergebnis</AlertTitle>
        <AlertDescription>{bewertung}</AlertDescription>
      </Alert>
      <Button onClick={handlePDFDownload}>
        <FileDown className="mr-2 h-4 w-4" /> Bericht herunterladen (PDF)
      </Button>
    </div>
  );
};

export default Summary;

