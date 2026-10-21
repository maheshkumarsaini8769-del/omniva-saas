// frontend/src/components/products/ImageUploader.jsx
// Drag-and-drop product image uploader.
// - uploads to POST /api/upload/product-image (multipart)
// - shows real upload progress
// - keeps a plain URL fallback for merchants who already host an image
// - supports reordering and removing images

import React, { useCallback, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Link2,
  ImagePlus,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { buildImageEntry, buildImageEntryFromUrl, getImageUrl } from '../../utils/productImages';

const MAX_IMAGES = 6;
const MAX_FILE_MB = 5;

const getToken = () => localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';

export const ImageUploader = ({ value = [], onChange, disabled = false, max = MAX_IMAGES }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const images = Array.isArray(value) ? value : [];

  const uploadFile = useCallback(
    (file) => {
      if (!file) return;
      setError('');

      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        setError('Only JPEG, PNG or WebP images are supported.');
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`Image is too large. Maximum size is ${MAX_FILE_MB}MB.`);
        return;
      }
      if (images.length >= max) {
        setError(`You can add up to ${max} images.`);
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const xhr = new XMLHttpRequest();
      setUploading(true);
      setProgress(0);

      xhr.open('POST', '/api/upload/product-image');
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setProgress(0);
        let payload = {};
        try {
          payload = JSON.parse(xhr.responseText || '{}');
        } catch {
          payload = {};
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
          const entry = buildImageEntry(payload.data);
          if (entry) onChange([...images, entry]);
          return;
        }
        setError(payload.message || 'The image could not be uploaded. Please try again.');
      };

      xhr.onerror = () => {
        setUploading(false);
        setProgress(0);
        setError('The image could not be uploaded. Check your connection and try again.');
      };

      xhr.send(formData);
    },
    [images, max, onChange]
  );

  const handleFiles = (fileList) => {
    const file = fileList && fileList[0];
    if (file) uploadFile(file);
  };

  const moveImage = (index, direction) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  const removeImage = (index) => {
    const next = images.filter((_, position) => position !== index);
    onChange(next);
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError('Enter a full image URL starting with http:// or https://');
      return;
    }
    if (images.length >= max) {
      setError(`You can add up to ${max} images.`);
      return;
    }
    const entry = buildImageEntryFromUrl(url);
    if (entry) onChange([...images, entry]);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
  };

  const atLimit = images.length >= max;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled || uploading) return;
          handleFiles(event.dataTransfer?.files);
        }}
        onClick={() => {
          if (!disabled && !uploading && !atLimit) inputRef.current?.click();
        }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40'
        } ${disabled || uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = '';
          }}
        />
        {uploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading image... {progress}%</span>
            </div>
            <div className="h-2 w-full max-w-xs mx-auto rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <ImagePlus className="w-7 h-7 mx-auto text-indigo-500" />
            <p className="text-xs font-bold text-slate-800">
              Drop a product photo here, or tap to browse
            </p>
            <p className="text-[11px] text-slate-500">
              JPEG, PNG or WebP up to {MAX_FILE_MB}MB. We resize it to 200px, 600px and 1200px
              automatically.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={`${getImageUrl(image, 'full')}-${index}`}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="aspect-square bg-slate-50">
                <img
                  src={getImageUrl(image, 'card')}
                  alt={image?.alt || `Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-[9px] font-bold text-white">
                  COVER
                </span>
              )}
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  title="Move earlier"
                  className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  title="Move later"
                  className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Remove image"
                  className="p-1.5 rounded-lg bg-white/90 border border-rose-200 text-rose-500 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5" />
          {showUrlInput ? 'Hide image link' : 'Use an image link instead'}
        </button>
        <span className="text-[10px] text-slate-400 font-semibold">
          {images.length}/{max} images
        </span>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com/product.jpg"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={addUrl}
            className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
