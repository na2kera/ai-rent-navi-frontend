import React, { useRef, useState, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropModalProps {
  isOpen: boolean;
  src: string | null;
  onClose: () => void;
  onCropped: (dataUrl: string) => void;
}

// react-image-crop を使ったリサイズ可能トリミング
const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  src,
  onClose,
  onCropped,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 60,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // 初期化
      setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 60 });
      setCompletedCrop(null);
    }
  }, [isOpen]);

  const onImageLoad = useCallback((img: HTMLImageElement) => {
    imgRef.current = img;
  }, []);

  const toCanvas = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(completedCrop.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(completedCrop.height * pixelRatio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingQuality = "high";

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      Math.floor(completedCrop.x * scaleX),
      Math.floor(completedCrop.y * scaleY),
      Math.floor(completedCrop.width * scaleX),
      Math.floor(completedCrop.height * scaleY),
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }, [completedCrop]);

  const handleConfirm = useCallback(async () => {
    const canvas = await toCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCropped(dataUrl);
    onClose();
  }, [onCropped, onClose, toCanvas]);

  if (!isOpen || !src) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h2>🖼 画像をトリミング</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            keepSelection
          >
            <img
              ref={imgRef}
              src={src}
              alt="選択画像"
              onLoad={(e) => onImageLoad(e.currentTarget)}
              style={{ maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        <div className="camera-controls" style={{ marginTop: 12 }}>
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={
              !completedCrop ||
              completedCrop.width < 5 ||
              completedCrop.height < 5
            }
          >
            この範囲で確定
          </button>
          <button className="retake-button" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
