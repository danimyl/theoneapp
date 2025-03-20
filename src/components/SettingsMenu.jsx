import { IoClose } from 'react-icons/io5';
import { FaToggleOn, FaToggleOff, FaMoon, FaSun } from 'react-icons/fa';
import useSettingsStore from '../store/settingsStore';

const SettingsMenu = ({ isOpen, onClose }) => {
  const { 
    alwaysHourlyReminders, 
    setAlwaysHourlyReminders,
    sleepStart,
    setSleepStart,
    sleepEnd,
    setSleepEnd
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div
      className="settings-modal"
      onClick={onClose}
    >
      <div
        className="settings-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-text">Settings</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-spotify-card-hover hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <IoClose size={20} className="text-secondary-text" />
          </button>
        </div>
        
        <div className="space-y-5">
          <div className="pb-5 border-b border-gray-800">
            <h3 className="text-sm uppercase font-bold tracking-wider text-secondary-text mb-4">
              Notification Settings
            </h3>
            
            <div className="flex items-center justify-between py-2 group cursor-pointer"
                 onClick={() => setAlwaysHourlyReminders(!alwaysHourlyReminders)}>
              <div>
                <p className="text-primary-text font-medium">Hourly Reminders</p>
                <p className="text-xs text-secondary-text mt-1">
                  Always turn on hourly reminders for all steps
                </p>
              </div>
              <div className="text-spotify-green text-3xl">
                {alwaysHourlyReminders ? <FaToggleOn /> : <FaToggleOff className="text-gray-600 group-hover:text-gray-400" />}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-primary-text font-medium mb-2">Quiet Hours</p>
              <p className="text-xs text-secondary-text mb-3">
                No notifications will be sent during these hours
              </p>
              
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center">
                  <FaMoon className="text-secondary-text mr-2" />
                  <label className="text-secondary-text text-sm mr-2">From:</label>
                  <input 
                    type="time" 
                    value={sleepStart}
                    onChange={(e) => setSleepStart(e.target.value)}
                    className="bg-spotify-darker border border-gray-700 rounded px-2 py-1 text-primary-text"
                  />
                </div>
                
                <div className="flex items-center">
                  <FaSun className="text-secondary-text mr-2" />
                  <label className="text-secondary-text text-sm mr-2">To:</label>
                  <input 
                    type="time" 
                    value={sleepEnd}
                    onChange={(e) => setSleepEnd(e.target.value)}
                    className="bg-spotify-darker border border-gray-700 rounded px-2 py-1 text-primary-text"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-sm uppercase font-bold tracking-wider text-secondary-text mb-4">
              About
            </h3>
            <p className="text-sm text-secondary-text">
              Steps to Knowledge is a 365-step program designed to develop your connection with 
              Knowledge, the deeper spiritual mind within you.
            </p>
            <div className="mt-4 flex justify-end">
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

export default SettingsMenu;
