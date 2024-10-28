import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bild } from '../types'; 

interface UploadedImageListProps {
  bilder: Bild[];
}

const UploadedImageList: React.FC<UploadedImageListProps> = ({ bilder }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hochgeladene Bilder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bilder.map((bild, index) => (
            <div key={bild.imageKey} className="border rounded-lg p-4">
              <img 
                src={`${process.env.REACT_APP_API_URL}/getimage/${bild.filename}`} 
                alt={`Bild ${index + 1}`} 
                className="w-full h-48 object-cover rounded" 
              />
              <p className="mt-2 text-sm text-gray-600">{bild.filename}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadedImageList;
