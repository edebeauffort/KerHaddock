import Image from "next/image";

// Drop-in replacement for a single `<Image fill className="object-cover" />`
// cover photo — fills its parent's `relative` box exactly the same way,
// but shows a 1-big/2-small (or side-by-side, or single) mosaic when a
// memory has more than one photo, instead of just the first one.
export default function MemoryMosaic({
  photoUrls,
  imageClassName = "",
}: {
  photoUrls: string[];
  imageClassName?: string;
}) {
  if (photoUrls.length === 0) {
    return <div className="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-sage to-brand-mint" />;
  }

  if (photoUrls.length === 1) {
    return <Image src={photoUrls[0]} alt="" fill className={`object-cover ${imageClassName}`} />;
  }

  if (photoUrls.length === 2) {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
        {photoUrls.map((url, i) => (
          <div key={i} className="relative bg-slate-100">
            <Image src={url} alt="" fill className={`object-cover ${imageClassName}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
      <div className="relative row-span-2 bg-slate-100">
        <Image src={photoUrls[0]} alt="" fill className={`object-cover ${imageClassName}`} />
      </div>
      {photoUrls.slice(1, 3).map((url, i) => (
        <div key={i} className="relative bg-slate-100">
          <Image src={url} alt="" fill className={`object-cover ${imageClassName}`} />
        </div>
      ))}
    </div>
  );
}
