'use client'

import { Button } from "@/components/ui/button";
import { Edit, Globe } from "lucide-react";
import Link from 'next/link';
import { useParams,  } from 'next/navigation';



export default function SitePreviewPage() {
  const params = useParams();
  const domain = decodeURIComponent(params.domain as string);

  return (
    <div className="min-h-screen">
      {/* Claim Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="font-semibold">Site preview</span>
            </div>

          </div>

          <div className="flex items-center gap-3">
           

            <Link href={`/edit/${encodeURIComponent(domain)}`}>
              <Button size="sm" variant="secondary" className="gap-2">
                <Edit className="w-4 h-4" />
                Finish setup
              </Button>
            </Link>
          </div>
        </div>

        
      </div>

      {/* Full Site Preview - Use single download route */}
      <div className="relative">
        <iframe
          src={`/download/${encodeURIComponent(domain)}`}
          className="w-full h-screen border-0"
          title={`${domain} Preview`}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
