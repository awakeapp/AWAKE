import { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format } from 'date-fns';
import JumpDateModal from '../../organisms/JumpDateModal';

import { useScrollLock } from '../../../hooks/useScrollLock';

const AddTaskModal = ({ isOpen, onClose, onAdd, initialDate }) => {
 useScrollLock(isOpen);
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [category, setCategory] = useState('Work');
 const [priority, setPriority] = useState('Medium');
 const [startTime, setStartTime] = useState('09:00');
 const [date, setDate] = useState(initialDate);
 const [showDatePicker, setShowDatePicker] = useState(false);

 // Reset form when opening
 useEffect(() => {
 if (isOpen) {
 setTitle('');
 setDescription('');
 setCategory('Work');
 setPriority('Medium');
 setStartTime('09:00');
 setDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
 }
 }, [isOpen, initialDate]);

 const [isSubmitting, setIsSubmitting] = useState(false);

 // Dynamic Word Count
 const getWordCount = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;
 const wordCount = getWordCount(description);

 const handleDescriptionChange = (e) => {
 const text = e.target.value;
 setDescription(text);
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!title.trim() || isSubmitting) return;

 if (wordCount > 20) {
     alert("Description must be 20 words or less.");
     return;
 }

 setIsSubmitting(true);
 try {
 await onAdd(title, {
 description,
 category,
 priority,
 time: startTime,
 date
 });
 // Parent handles closing on success
 } catch (error) {
 console.error("Error in modal submission:", error);
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 {/* Minimal Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 onClick={onClose}
 className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60]"
 />

 {/* Modal Container */}
 <motion.div
 initial={{ opacity: 0, scale: 0.98, y: 15 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.98, y: 10 }}
 transition={{ duration: 0.2, ease: "easeOut" }}
 className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
 >
 {/* Modal Dialog */}
 <div className="bg-white dark:bg-[#111827] w-full max-w-sm rounded-[24px] pointer-events-auto flex flex-col shadow-2xl relative overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
 <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">New Task</h2>
 <button 
 onClick={onClose} 
 className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors "
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Scrollable Body */}
 <div className="overflow-y-auto max-h-[75vh]">
 <form id="addTaskForm" onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
 
 {/* Titles & Description (Stacked) */}
 <div className="flex flex-col gap-4">
 <div>
 <input
 autoFocus
 type="text"
 placeholder="Task name"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full text-[16px] bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[14px] px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium transition-all"
 />
 </div>

 <div className="relative">
 <textarea
 placeholder="Description (optional)"
 value={description}
 onChange={handleDescriptionChange}
 rows="2"
 className="w-full text-[14px] bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[14px] px-4 py-3 pb-8 focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 transition-all resize-none"
 />
 <div className="absolute bottom-2.5 right-3.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 pointer-events-none">
 {wordCount}/20
 </div>
 </div>
 </div>

 {/* Configuration Grid */}
 <div className="grid grid-cols-2 gap-3">
 {/* Category */}
 <div className="relative">
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="w-full appearance-none bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[12px] px-3.5 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all"
 >
 <option value="Work">Work</option>
 <option value="Health">Health</option>
 <option value="Personal">Personal</option>
 <option value="Spiritual">Spiritual</option>
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
 </div>

 {/* Priority */}
 <div className="relative">
 <select
 value={priority}
 onChange={(e) => setPriority(e.target.value)}
 className="w-full appearance-none bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[12px] px-3.5 py-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all"
 >
 <option value="Low">Low</option>
 <option value="Medium">Medium</option>
 <option value="High">High</option>
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 {/* Start Time */}
 <div className="relative flex items-center bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[12px] overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
 <div className="pl-3.5 pr-2 py-3 flex items-center justify-center pointer-events-none">
 <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
 </div>
 <input
 type="time"
 value={startTime}
 onChange={(e) => setStartTime(e.target.value)}
 className="w-full bg-transparent border-none p-0 py-3 pr-3 text-[14px] font-medium text-slate-800 dark:text-slate-200 focus:ring-0"
 />
 </div>

 {/* Date */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setShowDatePicker(!showDatePicker)}
 className="w-full h-full flex items-center bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.04] rounded-[12px] px-3.5 py-3 focus:ring-2 focus:ring-indigo-500/30 transition-all text-left"
 >
 <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mr-2" />
 <span className="text-[14px] font-medium text-slate-800 dark:text-slate-200 truncate">
 {date ? format(new Date(date), 'MMM do') : 'Today'}
 </span>
 </button>

 <JumpDateModal
 isOpen={showDatePicker}
 initialDate={date ? new Date(date) : new Date()}
 onSelect={(newDate) => {
 if (newDate) {
 setDate(format(newDate, 'yyyy-MM-dd'));
 } else {
 setDate(null);
 }
 }}
 minDate={new Date()}
 onClose={() => setShowDatePicker(false)}
 />
 </div>
 </div>
 
 {/* Action Footers embedded in scroll to prevent squishing on tiny screens */}
 <div className="pt-2 mt-1 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={onClose}
 disabled={isSubmitting}
 className="px-4 py-2.5 rounded-[12px] text-[15px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={!title.trim() || isSubmitting}
 className="px-6 py-2.5 rounded-[12px] text-[15px] font-semibold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors active:scale-[0.98] flex items-center"
 >
 {isSubmitting ? 'Saving...' : 'Save'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
};

export default AddTaskModal;
