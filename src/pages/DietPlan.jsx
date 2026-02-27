import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Droplets, Flame, RotateCcw, ChevronDown, ChevronUp, Heart, AlertCircle, Activity, Info, ArrowLeft } from 'lucide-react';
import Button from '../components/atoms/Button';
import { calculateTDEE, generatePlan, RECOMMENDED_FOODS, FOODS_TO_AVOID } from '../utils/dietUtils';
import { useNavigate } from 'react-router-dom';
import { AppCard as Card, AppCardContent } from '../components/ui/AppCard';
import { DB } from '../services/db';
import { useAuthContext } from '../hooks/useAuthContext';

const DietPlan = () => {
 const navigate = useNavigate();
 const { user } = useAuthContext();
 const [step, setStep] = useState('input'); // 'input' | 'plan'
 const [formData, setFormData] = useState({
 age: '',
 weight: '',
 height: '',
 gender: 'male',
 activity: 'sedentary',
 preference: 'non-veg',
 goalSpeed: 'normal'
 });
 const [result, setResult] = useState(null);
 const [expandedDay, setExpandedDay] = useState(null);

 // Load saved plan
 useEffect(() => {
 if (!user) return;
 const unsub = DB.subscribeToModule(user.uid, 'diet', (data) => {
 if (data && data.plan) {
 setResult(data.plan);
 if (data.profile) {
 setFormData(prev => ({ ...prev, ...data.profile }));
 }
 setStep('plan');
 }
 });
 return () => unsub();
 }, [user]);

 const handleInputChange = (e) => {
 const { name, value } = e.target;
 setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleGenerate = async (e) => {
 e.preventDefault();
 const tdee = calculateTDEE(
 formData.age,
 formData.weight,
 formData.height,
 formData.gender,
 formData.activity
 );
 const plan = generatePlan(tdee, formData.weight, formData.goalSpeed, formData.preference);
 setResult(plan);
 setStep('plan');

 if (user) {
 await DB.saveModule(user.uid, 'diet', {
 plan,
 profile: formData,
 updatedAt: new Date().toISOString()
 });
 }
 };

 const toggleDay = (index) => {
 setExpandedDay(expandedDay === index ? null : index);
 };

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
 {/* Header */}
 <div 
 className="bg-white dark:bg-slate-800 shadow-sm px-4 pt-4 pb-5 sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50"
 style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
 >
 <button
 onClick={() => {
 if (step === 'plan') {
 setStep('input');
 } else {
 navigate(-1);
 }
 }}
 className="p-2 bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-full transition-colors text-slate-700 dark:text-slate-300 -ml-2 focus:outline-none"
 >
 <ArrowLeft className="w-6 h-6" />
 </button>
 <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Diet Plan Manager</h1>
 </div>

 <main className="p-4 max-w-lg mx-auto">
 <AnimatePresence mode="wait">
 {step === 'input' ? (
 <motion.form
 key="input"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 className="space-y-6"
 onSubmit={handleGenerate}
 >
 <div className="space-y-4">
 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Tell us about yourself</h2>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Age</label>
 <input
 type="number"
 name="age"
 required
 value={formData.age}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 placeholder="Years"
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
 <select
 name="gender"
 value={formData.gender}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 >
 <option value="male">Male</option>
 <option value="female">Female</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Weight (kg)</label>
 <input
 type="number"
 name="weight"
 required
 value={formData.weight}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 placeholder="kg"
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Height (cm)</label>
 <input
 type="number"
 name="height"
 required
 value={formData.height}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 placeholder="cm"
 />
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Activity Level</label>
 <select
 name="activity"
 value={formData.activity}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 >
 <option value="sedentary">Sedentary (Little/No exercise)</option>
 <option value="light">Lightly Active (1-3 days/week)</option>
 <option value="moderate">Moderately Active (3-5 days/week)</option>
 <option value="active">Very Active (6-7 days/week)</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Food Preference</label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setFormData({ ...formData, preference: 'veg' })}
 className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.preference === 'veg'
 ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300'
 : 'border-slate-200 dark:border-slate-700 text-slate-500'
 }`}
 >
 Vegetarian
 </button>
 <button
 type="button"
 onClick={() => setFormData({ ...formData, preference: 'non-veg' })}
 className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.preference === 'non-veg'
 ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
 : 'border-slate-200 dark:border-slate-700 text-slate-500'
 }`}
 >
 Non-Veg
 </button>
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-semibold text-slate-500 uppercase">Goal Speed</label>
 <select
 name="goalSpeed"
 value={formData.goalSpeed}
 onChange={handleInputChange}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700"
 >
 <option value="slow">Slow & Steady (0.25kg/week)</option>
 <option value="normal">Normal (0.5kg/week)</option>
 <option value="fast">Aggressive (0.75kg/week)</option>
 </select>
 </div>
 </div>

 <Button className="w-full py-4 text-lg shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-500 border-none">
 Generate Plan
 </Button>
 </motion.form>
 ) : (
 <motion.div
 key="plan"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="space-y-6"
 >
 {/* Summary Card */}
 <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
 <div className="flex justify-between items-start mb-6">
 <div>
 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Daily Target</p>
 <h2 className="text-3xl font-black mt-1">{result.targetCalories} <span className="text-lg font-medium text-slate-400">kcal</span></h2>
 </div>
 <div className="text-right">
 <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Water</p>
 <div className="flex items-center gap-1 justify-end mt-1 text-blue-300">
 <Droplets className="w-4 h-4" />
 <span className="text-xl font-bold">{result.waterIntake}L</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-2 text-center text-xs">
 <div className="bg-white/10 p-2 rounded-lg">
 <span className="block font-bold text-lg">{result.macros.protein}g</span>
 <span className="text-slate-400">Protein</span>
 </div>
 <div className="bg-white/10 p-2 rounded-lg">
 <span className="block font-bold text-lg">{result.macros.carbs}g</span>
 <span className="text-slate-400">Carbs</span>
 </div>
 <div className="bg-white/10 p-2 rounded-lg">
 <span className="block font-bold text-lg">{result.macros.fats}g</span>
 <span className="text-slate-400">Fats</span>
 </div>
 </div>
 </div>

 {/* Recommendations */}
 <div className="grid grid-cols-1 gap-4">
 <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
 <AppCardContent className="p-4">
 <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
 <Heart className="w-4 h-4" />
 Recommended
 </h4>
 <ul className="space-y-2">
 {RECOMMENDED_FOODS.slice(0, 3).map((item, i) => (
 <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
 {item}
 </li>
 ))}
 </ul>
 </AppCardContent>
 </Card>

 <Card className="bg-red-50 border-red-100">
 <AppCardContent className="p-4">
 <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3 text-sm uppercase tracking-wide">
 <AlertCircle className="w-4 h-4" />
 Avoid
 </h4>
 <ul className="space-y-2">
 {FOODS_TO_AVOID.slice(0, 3).map((item, i) => (
 <li key={i} className="flex items-center gap-2 text-sm text-red-700">
 <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
 {item}
 </li>
 ))}
 </ul>
 </AppCardContent>
 </Card>
 </div>

 {/* Plan List */}
 <div className="space-y-3">
 <h3 className="font-bold text-slate-800 dark:text-slate-200 mt-2">Weekly Meal Plan</h3>
 {result.weeklyPlan.map((day, idx) => (
 <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
 <button
 onClick={() => toggleDay(idx)}
 className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
 {day.day.split(' ')[1]}
 </div>
 <div>
 <h3 className="font-bold text-slate-700 dark:text-slate-200">{day.day}</h3>
 <p className="text-xs text-slate-400">{day.totalCalories} kcal</p>
 </div>
 </div>
 {expandedDay === idx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
 </button>

 <AnimatePresence>
 {expandedDay === idx && (
 <motion.div
 initial={{ height: 0 }}
 animate={{ height: 'auto' }}
 exit={{ height: 0 }}
 className="overflow-hidden bg-slate-50 dark:bg-slate-900/50"
 >
 <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-700">
 <div className="space-y-1 mt-3">
 <p className="text-xs font-bold text-slate-400 uppercase">Breakfast</p>
 <div className="flex justify-between text-sm">
 <span className="text-slate-700 dark:text-slate-300">{day.meals.breakfast.name}</span>
 <span className="text-slate-400 font-mono text-xs">{day.meals.breakfast.calories}</span>
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-xs font-bold text-slate-400 uppercase">Lunch</p>
 <div className="flex justify-between text-sm">
 <span className="text-slate-700 dark:text-slate-300">{day.meals.lunch.name}</span>
 <span className="text-slate-400 font-mono text-xs">{day.meals.lunch.calories}</span>
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-xs font-bold text-slate-400 uppercase">Dinner</p>
 <div className="flex justify-between text-sm">
 <span className="text-slate-700 dark:text-slate-300">{day.meals.dinner.name}</span>
 <span className="text-slate-400 font-mono text-xs">{day.meals.dinner.calories}</span>
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-xs font-bold text-slate-400 uppercase">Snack</p>
 <div className="flex justify-between text-sm">
 <span className="text-slate-700 dark:text-slate-300">{day.meals.snack.name}</span>
 <span className="text-slate-400 font-mono text-xs">{day.meals.snack.calories}</span>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ))}
 </div>

 <Button
 variant="secondary"
 onClick={handleGenerate}
 className="w-full gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/20"
 >
 <RotateCcw className="w-4 h-4" />
 Regenerate Plan
 </Button>
 </motion.div>
 )}
 </AnimatePresence>
 </main>
 </div>
 );
};

export default DietPlan;
