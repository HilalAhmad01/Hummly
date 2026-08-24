'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DirectRoomRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.code) {
      const code = String(params.code).toUpperCase();
      router.replace(`/multiplayer?room=${code}`);
    } else {
      router.replace('/multiplayer');
    }
  }, [params, router]);

  return (
    <div className="w-full flex-1 flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#00E575] border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-slate-400">Connecting to Room...</span>
      </div>
    </div>
  );
}
