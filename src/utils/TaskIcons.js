import {
    Sun, Droplets, Moon, CloudMoon, Coffee, Utensils, BookOpen,
    Wind, Activity, Footprints, School, Users, CheckCircle, Smartphone,
    Candy, CreditCard, Pizza, GlassWater, Wallet
} from 'lucide-react';

export const getIconForTask = (name) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('wake')) return Sun;
    if (lowerName.includes('water')) return Droplets;
    if (lowerName.includes('sleep') || lowerName.includes('bed')) return Moon;
    if (lowerName.includes('wind') || lowerName.includes('breathe')) return Wind;
    if (lowerName.includes('prayer') || lowerName.includes('fajr') || lowerName.includes('maghrib') || lowerName.includes('isha')) return CloudMoon;
    if (lowerName.includes('quran') || lowerName.includes('stories')) return BookOpen;
    if (lowerName.includes('breakfast') || lowerName.includes('lunch') || lowerName.includes('dinner') || lowerName.includes('smoothie')) return Utensils;
    if (lowerName.includes('workout')) return Activity;
    if (lowerName.includes('walk')) return Footprints;
    if (lowerName.includes('class') || lowerName.includes('learning')) return School;
    if (lowerName.includes('family') || lowerName.includes('attendance')) return Users;

    return CheckCircle; // Default
};

export const HABIT_ICONS = {
    junkFood: Pizza,
    sugar: Candy,
    coldDrinks: GlassWater,
    screenTime: Smartphone,
    logExpense: Wallet
};
