'use client';

import { useEffect, useState } from 'react';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-next';

export default function DevToolbar() {
  const [isClient, setIsClient] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render in development mode and on client side
  if (!isDevelopment || !isClient) {
    return null;
  }

  return (
    <TwentyFirstToolbar
      config={{
        plugins: [], // Add your custom plugins here
      }}
    />
  );
}