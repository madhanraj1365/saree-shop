import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '@/utils/cropUtils';

export default function ImageCropperModal({
  imageFile,
  onCropComplete,
  onCancel,
  title = 'Draw Your Crop Box',
  hint,
}) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [localImgSrc, setLocalImgSrc] = useState('');
  const imgSrc = typeof imageFile === 'string' ? imageFile : localImgSrc;

  useEffect(() => {
    if (!imageFile || typeof imageFile === 'string') {
      return undefined;
    }

    let isActive = true;
    const reader = new FileReader();

    reader.onload = () => {
      if (isActive && typeof reader.result === 'string') {
        setLocalImgSrc(reader.result);
      }
    };

    reader.readAsDataURL(imageFile);

    return () => {
      isActive = false;
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [imageFile]);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const initialCrop = {
      unit: '%',
      x: 10,
      y: 10,
      width: Math.min(80, width > height ? 60 : 80),
      height: Math.min(80, height > width ? 60 : 80),
    };
    setCrop(initialCrop);
  }

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      // If no crop, just return the original file
      onCropComplete(imageFile);
      return;
    }

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const scaledCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedBlob = await getCroppedImg(imgSrc, scaledCrop, 0);

      if (!croppedBlob) {
        throw new Error('Crop generation failed');
      }
      
      const fileName = typeof imageFile === 'string' ? `recrop-${Date.now()}.jpg` : imageFile.name;
      const croppedFile = new File([croppedBlob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      
      onCropComplete(croppedFile);
    } catch (e) {
      console.error(e);
      onCropComplete(imageFile);
    }
  };

  if (!imgSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-4xl flex-col rounded-[16px] bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl text-[#43242d]">{title}</h3>
          <p className="text-sm text-[#6d6064]">
            {hint || 'Draw the crop exactly the way you want it to appear.'}
          </p>
        </div>
        
        <div className="relative flex h-[60vh] w-full items-center justify-center overflow-auto rounded bg-[#f3ead8]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', width: 'auto', minWidth: '240px' }}
            />
          </ReactCrop>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-[8px] bg-[#f3ead8] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4a3b32] transition hover:bg-[#e7d8bf]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto rounded-[8px] bg-[#8e1f3f] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#6f1730]"
          >
            Confirm Crop
          </button>
        </div>
      </div>
    </div>
  );
}
