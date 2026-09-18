import React, { useState } from 'react';
import { Search, Loader2, Check, ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useListMedia } from '@/services/media/hooks';
import { MediaAsset } from '@/services/media/types';

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  selectedId?: string | null;
}

export function ImagePicker({ isOpen, onClose, onSelect, selectedId }: ImagePickerProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListMedia({
    search: search.trim() || undefined,
    page,
    limit: 12,
    status: 'ACTIVE',
  });

  const assets = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const handleSelect = (asset: MediaAsset) => {
    onSelect(asset);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl max-h-[85vh] flex flex-col">
      <div className="space-y-4 p-1">
        <div>
          <h3 className="text-lg font-semibold">Select Existing Image</h3>
          <p className="text-sm text-muted-foreground">
            Choose an image from the uploaded media library.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images by filename or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Loading media library...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed rounded-lg">
            <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No images found</p>
            <p className="text-xs">Upload a new image or try a different search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[45vh] overflow-y-auto p-1">
            {assets.map((asset) => {
              const isSelected = selectedId === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset)}
                  className={`group relative border rounded-lg overflow-hidden cursor-pointer bg-background transition-all hover:border-primary flex flex-col ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'border-input'
                  }`}
                >
                  <div className="h-28 bg-muted flex items-center justify-center relative overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.fileName}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t bg-background/50 text-xs truncate">
                    <p className="font-medium truncate">{asset.fileName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
