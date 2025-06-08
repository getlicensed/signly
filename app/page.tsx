import PDFUpload from '@/components/PDFUpload';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <PDFUpload showLogoTagline />
      <footer className="mt-10 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Signly. All rights reserved.
      </footer>
    </main>
  );
}
