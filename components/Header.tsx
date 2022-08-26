export default function Header({ children }: { children: string }) {
  return (
    <h1 className="pt-5 text-2xl font-bold text-white pb-7 md:text-3xl">
      {children}
    </h1>
  );
}
