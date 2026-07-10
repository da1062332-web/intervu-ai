'use client';

export function EmbeddedCompiler() {
  return (
    <div className='w-full h-full min-h-[700px] flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-border/50'>
      <div className='bg-muted/30 px-4 py-3 border-b flex items-center justify-between'>
        <span className='font-semibold text-sm'>Coding Environment</span>
        <span className='text-xs text-muted-foreground'>Powered by OneCompiler</span>
      </div>
      <div className='flex-1 relative w-full h-full min-h-[650px]'>
        <iframe
          src='https://onecompiler.com/embed/python'
          width='100%'
          height='100%'
          frameBorder='0'
          title='OneCompiler'
          allow='clipboard-read; clipboard-write'
          className='absolute inset-0'
          style={{
            border: 'none',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
