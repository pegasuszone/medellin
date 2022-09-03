export default function Header({ children }: { children: string }) {
  return (
    <h1 className="pt-5 pb-2 text-2xl font-bold text-white lg:pb-7 md:text-3xl">
      {children}
    </h1>
  );
}
