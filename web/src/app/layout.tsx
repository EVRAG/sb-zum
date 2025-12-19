import type { Metadata } from "next";
import "./globals.css";
import { Snowfall } from "./_components/Snowfall";

export const metadata: Metadata = {
  title: "Виртуальное путешествие",
  description: "По Тверской области — интерактивный опыт",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#f2e7c4] text-black antialiased">
        <Snowfall />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
