// src/components/Loader.jsx
import { Loader2 } from "lucide-react";

const Loader = ({ size = 'medium', fullScreen = false, text = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto`} />
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
};

export default Loader;