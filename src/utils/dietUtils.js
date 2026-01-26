// KERALA FOOD DATABASE
// Approximate calories per serving
const FOOD_DB = {
    breakfast: [
        { name: "Puttu (1 piece) & Kadala Curry", calories: 350, protein: 12, type: "veg" },
        { name: "Appam (2 nos) & Veg Stew", calories: 320, protein: 6, type: "veg" },
        { name: "Appam (2 nos) & Egg Roast", calories: 380, protein: 14, type: "non-veg" },
        { name: "Idli (3 nos) & Sambar", calories: 300, protein: 10, type: "veg" },
        { name: "Dosa (2 nos) & Chutney", calories: 350, protein: 8, type: "veg" },
        { name: "Upma (1 cup) & Banana", calories: 300, protein: 6, type: "veg" },
        { name: "Oats Upma with Veggies", calories: 280, protein: 10, type: "veg" },
        { name: "Wheat Puttu & Green Gram", calories: 320, protein: 14, type: "veg" }
    ],
    lunch: [
        { name: "Matta Rice (1 cup), Thoran & Moru Curry", calories: 450, protein: 8, type: "veg" },
        { name: "Matta Rice (1 cup), Fish Curry & Thoran", calories: 500, protein: 25, type: "non-veg" },
        { name: "Curd Rice with Pickle", calories: 350, protein: 8, type: "veg" },
        { name: "Chicken Biryani (Small Portion)", calories: 600, protein: 25, type: "non-veg" },
        { name: "Veg Meals (Rice, Sambar, Avial)", calories: 500, protein: 12, type: "veg" },
        { name: "Ghee Rice & Chicken Roast (Small)", calories: 650, protein: 25, type: "non-veg" },
        { name: "Matta Rice & Omelette", calories: 480, protein: 15, type: "non-veg" }
    ],
    dinner: [
        { name: "Chappathi (2 nos) & Veg Kurma", calories: 350, protein: 10, type: "veg" },
        { name: "Chappathi (2 nos) & Chicken Curry", calories: 400, protein: 20, type: "non-veg" },
        { name: "Kanji & Payar (Green Gram)", calories: 320, protein: 12, type: "veg" },
        { name: "Wheat Dosa (2 nos) & Chutney", calories: 300, protein: 8, type: "veg" },
        { name: "Grilled Fish & Salad", calories: 350, protein: 30, type: "non-veg" },
        { name: "Fruit Salad & Nuts", calories: 250, protein: 5, type: "veg" }
    ],
    snacks: [
        { name: "Tea (Suggestion: No Sugar) & 2 Biscuits", calories: 120, protein: 2, type: "veg" },
        { name: "Coffee (Black/Low Sugar)", calories: 30, protein: 0, type: "veg" },
        { name: "Banana (Small)", calories: 90, protein: 1, type: "veg" },
        { name: "Handful of Peanuts", calories: 160, protein: 7, type: "veg" },
        { name: "Buttermilk (Sambharam)", calories: 60, protein: 2, type: "veg" }
    ]
};

// HELPERS
export const calculateTDEE = (age, weight, height, gender, activityLevel) => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    if (gender === 'female') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const multipliers = {
        sedentary: 1.2,      // Little or no exercise
        light: 1.375,        // Light exercise 1-3 days/week
        moderate: 1.55,      // Moderate exercise 3-5 days/week
        active: 1.725,       // Hard exercise 6-7 days/week
        very_active: 1.9     // Very hard exercise/physical job
    };

    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export const calculateMacros = (tdee, weight) => {
    const protein = Math.round(weight * 1.6); // 1.6g per kg
    const fats = Math.round((tdee * 0.25) / 9); // 25% of TDEE
    const carbs = Math.round((tdee - (protein * 4) - (fats * 9)) / 4); // Remainder

    return { protein, fats, carbs };
};

export const RECOMMENDED_FOODS = [
    "Idli / Dosa (Good Carbs)",
    "Sambar with Drumsticks (Fiber & Protein)",
    "Ragi Mudde (Calcium & Iron)",
    "Chickpea Sundal (Protein Snack)",
    "Curd Rice (Gut Health)"
];

export const FOODS_TO_AVOID = [
    "Deep Fried Bajjis/Bondas",
    "Sugary Mysore Pak (Limit intake)",
    "Processed Maida Parottas",
    "Excess White Rice at night"
];

export const generatePlan = (tdee, weight, goalSpeed, preference) => {
    // Goal Speed Deficits
    const deficits = {
        slow: 250,      // 0.25kg week
        normal: 500,    // 0.5kg week
        fast: 750       // 0.75kg week (aggressive)
    };

    let targetCalories = tdee - (deficits[goalSpeed] || 500);

    // Safety floors
    const minCalories = 1200;
    if (targetCalories < minCalories) targetCalories = minCalories;

    // Water intake (approx 35ml per kg)
    const waterIntake = Math.round(weight * 0.035 * 10) / 10; // Liters

    // Calculate Macros based on Target Calories (not maintenance TDEE)
    const macros = calculateMacros(targetCalories, weight);

    const plan = [];

    for (let day = 1; day <= 7; day++) {
        // Filter food by preference
        const filterFood = (items) => {
            if (preference === 'veg') return items.filter(i => i.type === 'veg');
            return items; // Non-veg enjoys everything
        };

        const availableBreakfast = filterFood(FOOD_DB.breakfast);
        const availableLunch = filterFood(FOOD_DB.lunch);
        const availableDinner = filterFood(FOOD_DB.dinner);
        const availableSnacks = filterFood(FOOD_DB.snacks);

        // Random Selection
        const breakfast = availableBreakfast[Math.floor(Math.random() * availableBreakfast.length)];
        const lunch = availableLunch[Math.floor(Math.random() * availableLunch.length)];
        const dinner = availableDinner[Math.floor(Math.random() * availableDinner.length)];

        // Fill remainder with snacks logic (simplified for now to just pick 1-2 snacks)
        const snack1 = availableSnacks[Math.floor(Math.random() * availableSnacks.length)];

        const totalCal = breakfast.calories + lunch.calories + dinner.calories + snack1.calories;

        plan.push({
            day: `Day ${day}`,
            meals: {
                breakfast,
                lunch,
                dinner,
                snack: snack1
            },
            totalCalories: totalCal,
            targetCalories: targetCalories
        });
    }

    return {
        tdee,
        targetCalories,
        waterIntake,
        macros,
        weeklyPlan: plan
    };
};
