export default function AvatarSelector({
  onSelect,
}: {
  onSelect: (avatarUrl: string) => void;
}) {
  const avatarOptions = [
    "pexels-rdne-5737237.jpg",
    "pexels-kamakshi-72543796-32994324.png",
    "pexels-karolina-grabowska-4084633.jpg",
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {avatarOptions.map((file) => {
        const src = `images/avatars/${file}`;
        return (
          <img
            key={file}
            src={src}
            alt={file}
            onClick={() => onSelect(src)}
            className="w-16 h-16 rounded-full cursor-pointer border hover:border-blue-500"
          />
        );
      })}
    </div>
  );
}
