'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Bookmark, Clock, AlertCircle } from 'lucide-react';
import React from 'react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className='space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar text-gray-800 font-sans select-none'>
        <div className='border-b pb-3 border-gray-200'>
          <h2 className='text-xl font-bold text-gray-900 tracking-tight'>
            General Examination Instructions
          </h2>
          <p className='text-xs text-gray-600 mt-1'>
            Please read the following rules and operational instructions carefully.
          </p>
        </div>

        <div className='space-y-4 text-sm leading-relaxed'>
          <div>
            <h3 className='font-bold text-gray-900 mb-2 underline'>1. Question Palette Legend</h3>
            <p className='mb-3 text-gray-700 text-xs'>
              The palette displayed on the right side of screen indicates the current status of each question using the following geometric symbols:
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-gray-50 p-3 rounded border border-gray-200'>
              <div className='flex items-center gap-2.5'>
                <span className='w-7 h-6 flex items-center justify-center bg-[#5cb85c] text-white font-bold rounded-full border border-[#4a9b4a] shadow-2xs'>
                  1
                </span>
                <div>
                  <span className='font-bold block text-gray-800'>Answered</span>
                  <span className='text-[11px] text-gray-500'>You have selected an answer.</span>
                </div>
              </div>
              <div className='flex items-center gap-2.5'>
                <span className='w-6 h-6 flex items-center justify-center bg-[#e54524] text-white font-bold rounded-sm border border-[#c33315] shadow-2xs'>
                  2
                </span>
                <div>
                  <span className='font-bold block text-gray-800'>Not Answered</span>
                  <span className='text-[11px] text-gray-500'>Visited without submitting response.</span>
                </div>
              </div>
              <div className='flex items-center gap-2.5'>
                <span className='w-7 h-6 flex items-center justify-center bg-[#8e24aa] text-white font-bold rounded-full border border-[#751c8e] shadow-2xs'>
                  3
                </span>
                <div>
                  <span className='font-bold block text-gray-800'>Marked for Review</span>
                  <span className='text-[11px] text-gray-500'>Flagged for re-checking later.</span>
                </div>
              </div>
              <div className='flex items-center gap-2.5'>
                <span className='w-6 h-6 flex items-center justify-center bg-white text-gray-700 font-bold rounded-sm border border-gray-300 shadow-2xs'>
                  4
                </span>
                <div>
                  <span className='font-bold block text-gray-800'>Not Visited</span>
                  <span className='text-[11px] text-gray-500'>You have not viewed this question.</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className='font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 underline'>
              <CheckCircle2 className='size-4 text-[#26773e]' />
              2. Saving &amp; Navigating Responses
            </h3>
            <ul className='list-disc pl-5 space-y-1 text-xs text-gray-700'>
              <li>
                To record your selected choice, you must click <span className='font-bold text-gray-900'>Save &amp; Next</span>. Moving to another question directly from the palette without clicking Save will discard unsaved choices.
              </li>
              <li>
                Click <span className='font-bold text-gray-900'>Clear Response</span> to deselect any radio button or option you previously chose for the active question.
              </li>
              <li>
                Click <span className='font-bold text-purple-700'>Mark for Review &amp; Next</span> if you remain doubtful and wish to revisit the question before final submission.
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 underline'>
              <Bookmark className='size-4 text-blue-700' />
              3. Section Navigation
            </h3>
            <ul className='list-disc pl-5 space-y-1 text-xs text-gray-700'>
              <li>
                Sections appear at the top fieldset bar. You can navigate between sections by clicking on the section tabs or utilizing the <span className='font-bold text-gray-900'>Next Section</span> button located at the bottom of the question palette.
              </li>
              <li>
                Sections marked with a lock icon cannot be entered until the designated sequence or timing criteria are met.
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-gray-900 mb-1.5 flex items-center gap-1.5 underline'>
              <Clock className='size-4 text-amber-600' />
              4. Examination Timer &amp; Proctoring
            </h3>
            <p className='text-xs text-gray-700'>
              The countdown timer located above the question palette indicates the remaining assessment duration. Your camera webcam is actively monitored throughout the duration of the test. Ensure your face remains visible inside the frame at all times.
            </p>
          </div>
        </div>

        <div className='flex justify-end pt-4 border-t border-gray-200 mt-6'>
          <Button
            onClick={onClose}
            className='bg-[#27783f] hover:bg-[#1f6333] text-white px-8 h-9 rounded-sm font-bold text-xs shadow-sm cursor-pointer'
          >
            I Understand &amp; Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
