import "../index.css";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Tambola - Online Housie Game</title>
        <meta name="description" content="Play Tambola (Housie) online with friends in real-time." />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
