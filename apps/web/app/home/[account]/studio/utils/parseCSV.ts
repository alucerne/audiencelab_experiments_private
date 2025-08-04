import Papa from 'papaparse';

export async function parseCSV(filePath: string): Promise<any[]> {
  const res = await fetch(filePath);
  const text = await res.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
    });
  });
} 