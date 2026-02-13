import {
    Dumbbell, Footprints, HeartPulse, GlassWater, Pill,
    BookOpen, Brain, PenTool, Code,
    Briefcase, Laptop, Mail, Building2,
    Sun, Moon, Star,
    Sparkles, Bed, Bath,
    Utensils, Coffee, ChefHat,
    Home, Trash2, Wrench,
    Wallet, Receipt, TrendingUp,
    CheckCircle, Calendar,
    Flame, Flower, Heart, Hand,
    Bike, Waves, GraduationCap,
    ShoppingBag, Users, Baby, Dog, Shirt,
    Disc, Music, Video, Gamepad2,
    Cross, // Verify if exists, otherwise fallback to Plus or similar
    CloudRain
} from 'lucide-react';

// Safety imports for fallbacks
import { Tag, Check } from 'lucide-react';

/**
 * Universal Icon Inference System
 * Supports: Islamic, Christian, Hindu, Secular, Fitness, Work, Home
 */
const ICON_MAP = [
    // --- 🌍 RELIGIOUS & SPIRITUAL ---
    {
        category: 'Islamic',
        keywords: ['fajr', 'maghrib', 'isha', 'taraweeh', 'tahajjud', 'ramadan', 'fast', 'suhoor', 'iftar'],
        icon: 'Moon',
        component: Moon
    },
    {
        category: 'Islamic Day',
        keywords: ['dhuhr', 'asr', 'jummah'],
        icon: 'Sun',
        component: Sun
    },
    {
        category: 'Holy Book',
        keywords: ['quran', 'bible', 'torah', 'gita', 'scripture', 'read', 'recite', 'tilawat'],
        icon: 'BookOpen',
        component: BookOpen
    },
    {
        category: 'Prayer Generic',
        keywords: ['pray', 'salah', 'namaz', 'dua', 'worship', 'devotion', 'dhikr', 'tasbih', 'rosary', 'meditate'],
        icon: 'Hand', // Hand usually represents prayer/dua
        component: Hand
    },
    {
        category: 'Place of Worship',
        keywords: ['masjid', 'mosque', 'church', 'temple', 'synagogue', 'gurdwara'],
        icon: 'Building2',
        component: Building2
    },
    {
        category: 'Hindu',
        keywords: ['puja', 'aarti', 'havan', 'chant', 'mantra'],
        icon: 'Flame',
        component: Flame
    },
    {
        category: 'Christian',
        keywords: ['sunday service', 'mass', 'fellowship'],
        icon: 'Sun', // Using Sun for "Light" or generic as Cross might not be standard in all sets
        component: Sun
    },

    // --- 💪 HEALTH & FITNESS ---
    {
        category: 'Gym',
        keywords: ['gym', 'lift', 'weight', 'train', 'muscle', 'crossfit', 'strength', 'bench', 'squat'],
        icon: 'Dumbbell',
        component: Dumbbell
    },
    {
        category: 'Cardio',
        keywords: ['run', 'walk', 'jog', 'hike', 'treadmill', 'step'],
        icon: 'Footprints',
        component: Footprints
    },
    {
        category: 'Cycling',
        keywords: ['bike', 'cycle', 'spin', 'ride'],
        icon: 'Bike',
        component: Bike
    },
    {
        category: 'Water Sports',
        keywords: ['swim', 'pool', 'surf', 'beach'],
        icon: 'Waves',
        component: Waves
    },
    {
        category: 'Yoga/Mind',
        keywords: ['yoga', 'stretch', 'pilates', 'breath', 'mindfulness'],
        icon: 'Brain',
        component: Brain
    },
    {
        category: 'Hydration',
        keywords: ['water', 'drink', 'hydrate', 'bottle', 'h2o'],
        icon: 'GlassWater',
        component: GlassWater
    },
    {
        category: 'Meds',
        keywords: ['pill', 'vitamin', 'supplement', 'meds', 'medicine', 'prescription'],
        icon: 'Pill',
        component: Pill
    },

    // --- 💼 WORK & PRODUCTIVITY ---
    {
        category: 'Work',
        keywords: ['work', 'job', 'client', 'project', 'business', 'office', 'career'],
        icon: 'Briefcase',
        component: Briefcase
    },
    {
        category: 'Deep Work',
        keywords: ['focus', 'deep work', 'code', 'program', 'dev', 'debug', 'laptop'],
        icon: 'Laptop',
        component: Laptop
    },
    {
        category: 'Comms',
        keywords: ['email', 'slack', 'outlook', 'message', 'inbox', 'reply'],
        icon: 'Mail',
        component: Mail
    },
    {
        category: 'Meetings',
        keywords: ['meeting', 'call', 'zoom', 'standup', 'sync', 'discuss'],
        icon: 'Users',
        component: Users
    },
    {
        category: 'Learning',
        keywords: ['study', 'learn', 'course', 'class', 'lecture', 'homework', 'exam', 'quiz'],
        icon: 'GraduationCap',
        component: GraduationCap
    },

    // --- 🏠 LIFE & HOME ---
    {
        category: 'Food',
        keywords: ['eat', 'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'food', 'cook', 'chef', 'baking'],
        icon: 'Utensils',
        component: Utensils
    },
    {
        category: 'Caffeine',
        keywords: ['coffee', 'tea', 'brew', 'espresso', 'matcha', 'latte'],
        icon: 'Coffee',
        component: Coffee
    },
    {
        category: 'Cleaning',
        keywords: ['clean', 'tidy', 'declutter', 'organize', 'vacuum', 'mop', 'dust'],
        icon: 'Sparkles',
        component: Sparkles
    },
    {
        category: 'Laundry',
        keywords: ['laundry', 'wash', 'clothes', 'iron', 'fold'],
        icon: 'Shirt',
        component: Shirt
    },
    {
        category: 'Trash',
        keywords: ['trash', 'garbage', 'bin', 'waste', 'recycle'],
        icon: 'Trash2',
        component: Trash2
    },
    {
        category: 'Groceries',
        keywords: ['shop', 'grocery', 'buy', 'store', 'market', 'mall'],
        icon: 'ShoppingBag',
        component: ShoppingBag
    },
    {
        category: 'Family',
        keywords: ['family', 'kids', 'baby', 'child', 'son', 'daughter', 'play'],
        icon: 'Baby',
        component: Baby
    },
    {
        category: 'Social',
        keywords: ['friend', 'hangout', 'party', 'date', 'visit', 'guest'],
        icon: 'Users',
        component: Users
    },
    {
        category: 'Pets',
        keywords: ['dog', 'cat', 'pet', 'walk dog', 'feed'],
        icon: 'Dog',
        component: Dog
    },
    {
        category: 'Finance',
        keywords: ['pay', 'bill', 'budget', 'finance', 'money', 'bank', 'invest', 'save'],
        icon: 'Wallet',
        component: Wallet
    },

    // --- 🛌 REST & RECOVERY ---
    {
        category: 'Sleep',
        keywords: ['sleep', 'nap', 'bed', 'wake', 'dream', 'snooze'],
        icon: 'Bed',
        component: Bed
    },
    {
        category: 'Bath',
        keywords: ['shower', 'bath', 'groom', 'brush', 'shave', 'spa', 'facewash'],
        icon: 'Bath',
        component: Bath
    },

    // --- 🎨 LEISURE ---
    {
        category: 'Read',
        keywords: ['read book', 'novel', 'article', 'news'], // specific to avoid generic 'read' conflict
        icon: 'BookOpen',
        component: BookOpen
    },
    {
        category: 'Write',
        keywords: ['write', 'journal', 'diary', 'blog', 'note'],
        icon: 'PenTool',
        component: PenTool
    },
    {
        category: 'Gaming',
        keywords: ['game', 'play', 'xbox', 'ps5', 'steam'],
        icon: 'Gamepad2',
        component: Gamepad2
    },
    {
        category: 'Media',
        keywords: ['watch', 'movie', 'tv', 'netflix', 'youtube', 'video'],
        icon: 'Video',
        component: Video
    },
    {
        category: 'Music',
        keywords: ['music', 'listen', 'podcast', 'spotify'],
        icon: 'Music',
        component: Music
    }
];

const getTimeFallback = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) return { icon: 'Sun', component: Sun };
    return { icon: 'Moon', component: Moon };
};

export const inferIcon = (name) => {
    // 1. Safety Check
    if (!name || typeof name !== 'string') return getTimeFallback();

    const lowerName = name.trim().toLowerCase();
    if (!lowerName) return getTimeFallback();

    // 2. Exact/Keyword Matching
    for (const entry of ICON_MAP) {
        // We use word boundary check for short words to avoid false positives (e.g. 'cat' in 'education')
        // But for simplicity and coverage, 'includes' is often better for compound user inputs.
        // We stick to 'includes' but rely on the ORDER of ICON_MAP for priority.
        if (entry.keywords.some(keyword => lowerName.includes(keyword))) {
            return { icon: entry.icon, component: entry.component };
        }
    }

    return getTimeFallback();
};

export const getIconComponent = (iconName) => {
    // 1. Search in Map
    const mapEntry = ICON_MAP.find(e => e.icon === iconName);
    if (mapEntry) return mapEntry.component;

    // 2. Common Fallbacks
    if (iconName === 'Sun') return Sun;
    if (iconName === 'Moon') return Moon;
    if (iconName === 'CheckCircle') return CheckCircle;
    if (iconName === 'Tag') return Tag;

    // 3. Ultimate Fallback (Safety)
    return Tag;
};
