import Avatar from "boring-avatars";

const avatarColors = ["#bae6fd", "#38bdf8", "#0ea5e9", "#0369a1", "#0c4a6e"];

export function StudentAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return <span className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 ring-1 ring-sky-100"><Avatar name={name} variant="beam" size={size} colors={avatarColors} title={`Avatar de ${name}`} /></span>;
}
