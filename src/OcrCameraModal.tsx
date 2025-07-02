import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";

interface OcrCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

const OcrCameraModal: React.FC<OcrCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleConfirm = async () => {
    if (capturedImage) {
      setIsProcessing(true);
      try {
        await onCapture(capturedImage);
        handleClose();
      } catch (error) {
        console.error("OCR処理中にエラーが発生しました:", error);
        alert("OCR処理中にエラーが発生しました。再度お試しください。");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>📷 OCR で読み取り</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="camera-container">
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="webcam"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "environment", // スマホでは背面カメラを使用
                }}
              />
              <div className="camera-controls">
                <button className="capture-button" onClick={capture}>
                  撮影
                </button>
                <button className="cancel-button" onClick={handleClose}>
                  キャンセル
                </button>
              </div>
            </>
          ) : (
            <>
              <img src={capturedImage} alt="撮影した画像" className="captured-image" />
              <div className="camera-controls">
                <button
                  className="confirm-button"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? "処理中..." : "この写真で確定"}
                </button>
                <button className="retake-button" onClick={handleRetake}>
                  再撮影
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrCameraModal;