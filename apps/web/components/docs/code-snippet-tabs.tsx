'use client';

import * as React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '@/components/common/copy-button';

interface CodeSnippetTabsProps {
  curl: string;
  typescript: string;
  cli?: string;
}

export function CodeSnippetTabs({
  curl,
  typescript,
  cli,
}: CodeSnippetTabsProps) {
  return (
    <Tabs defaultValue="curl" className="w-full">
      <div className="flex items-center justify-between mb-2">
        <TabsList>
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="typescript">TypeScript</TabsTrigger>
          {cli && <TabsTrigger value="cli">CLI</TabsTrigger>}
        </TabsList>
      </div>

      <TabsContent value="curl" className="relative mt-0">
        <div className="relative">
          <div className="absolute right-2 top-2 z-10">
            <CopyButton value={curl} />
          </div>
          <SyntaxHighlighter
            language="bash"
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            {curl}
          </SyntaxHighlighter>
        </div>
      </TabsContent>

      <TabsContent value="typescript" className="relative mt-0">
        <div className="relative">
          <div className="absolute right-2 top-2 z-10">
            <CopyButton value={typescript} />
          </div>
          <SyntaxHighlighter
            language="typescript"
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            {typescript}
          </SyntaxHighlighter>
        </div>
      </TabsContent>

      {cli && (
        <TabsContent value="cli" className="relative mt-0">
          <div className="relative">
            <div className="absolute right-2 top-2 z-10">
              <CopyButton value={cli} />
            </div>
            <SyntaxHighlighter
              language="bash"
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
              }}
            >
              {cli}
            </SyntaxHighlighter>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
