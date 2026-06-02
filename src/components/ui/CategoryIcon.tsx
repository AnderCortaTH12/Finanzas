import { icons } from 'lucide-react';

interface CategoryIconProps {
  /** Nombre de icono lucide en kebab-case, p.ej. 'shopping-bag'. */
  name: string;
  color: string;
  size?: number;
  /** Si true, dibuja un círculo de fondo con el color tenue. */
  withBackground?: boolean;
}

/** Convierte 'shopping-bag' -> 'ShoppingBag' (clave del registro de lucide). */
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/** Renderiza un icono lucide por su nombre, con color de categoría. */
export function CategoryIcon({
  name,
  color,
  size = 20,
  withBackground = false,
}: CategoryIconProps) {
  const Icon = icons[toPascalCase(name) as keyof typeof icons] ?? icons.Circle;

  if (!withBackground) {
    return <Icon size={size} color={color} />;
  }

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size * 2,
        height: size * 2,
        backgroundColor: `${color}22`, // color con ~13% de opacidad
      }}
    >
      <Icon size={size} color={color} />
    </div>
  );
}
