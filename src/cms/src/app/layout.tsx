// Root layout — для не-payload routes (если будут). Cms-инстанс по дефолту только Payload admin
// (`(payload)/`), поэтому этот layout — минимальный stub.
import React from 'react';

export const metadata = {
  title: 'CMS',
  description: 'Payload admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
