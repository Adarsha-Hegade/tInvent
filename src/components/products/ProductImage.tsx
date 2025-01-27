import { Fan } from 'lucide-react';

interface ProductImageProps {
  modelNo: string;
  name: string;
}

export function ProductImage({ modelNo, name }: ProductImageProps) {
  const imageUrl = `/images/${modelNo}.png`;
  

  return (
    <div className="w-16 h-16 relative flex items-center justify-center bg-muted rounded-md overflow-hidden">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <Fan className="w-8 h-8 text-muted-foreground hidden" />
    </div>
  );
}