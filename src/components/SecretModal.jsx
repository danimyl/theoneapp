import { IoClose } from 'react-icons/io5';

const SecretModal = ({ isOpen, onClose, secret }) => {

  if (!isOpen || !secret) {
    return null;
  }
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div
        className="bg-spotify-card w-full max-w-2xl mx-4 rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-text">Daily Secret</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-spotify-card-hover hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <IoClose size={20} className="text-secondary-text" />
          </button>
        </div>
        
        <div className="space-y-5">
          <div className="pb-5 border-b border-gray-800">
            <p className="text-primary-text leading-relaxed whitespace-pre-line">
              {secret}
            </p>
          </div>
          
          <div className="pt-2 flex justify-end">
            <button 
              className="text-xs uppercase font-bold tracking-wider text-spotify-green hover:text-spotify-green-hover transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SecretModal;
