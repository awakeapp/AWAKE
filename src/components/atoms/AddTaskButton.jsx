import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const AddTaskButton = ({ onClick }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-colors"
        >
            <Plus className="w-6 h-6" />
        </motion.button>
    );
};

export default AddTaskButton;
