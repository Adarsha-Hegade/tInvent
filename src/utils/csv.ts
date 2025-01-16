export async function parseCSV(file: File) {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce((obj, header, index) => {
        const value = values[index];
        obj[header] = ['total_stock', 'bad_stock'].includes(header)
          ? Number(value)
          : value;
        return obj;
      }, {} as Record<string, any>);
    });
}