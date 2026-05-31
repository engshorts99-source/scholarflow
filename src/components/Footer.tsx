export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0f19] py-8 text-center text-sm text-gray-500 mt-20">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} Schox. All rights reserved.</p>
        <p className="mt-2 text-xs">
          Data provided by <a href="https://openalex.org" className="hover:text-gray-300 underline underline-offset-2">OpenAlex</a> and <a href="https://semanticscholar.org" className="hover:text-gray-300 underline underline-offset-2">Semantic Scholar</a>.
        </p>
      </div>
    </footer>
  );
}
