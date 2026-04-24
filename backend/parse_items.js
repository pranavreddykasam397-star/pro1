const fs = require('fs');

const raw = fs.readFileSync('./items', 'utf-8');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

// Skip header lines ("Here is your complete menu...", "name", "url", "price")
// Items start from line index 3 (after the header)
const dataLines = lines.slice(3); // skip "Here is your complete menu...", "name", "url"

const items = [];
for (let i = 0; i < dataLines.length; i += 3) {
    const name = dataLines[i]?.trim();
    const imageUrl = dataLines[i + 1]?.trim();
    let priceStr = dataLines[i + 2]?.trim();
    
    if (!name || !imageUrl || !priceStr) break;
    
    // Extract numeric price, handling cases like "₹300 (Half)", "₹140 (2 pcs)"
    // [Fix 2.5] Tolerant regex + visible fallback
    const priceMatch = priceStr.match(/₹\s*(\d+)/);
    let price = null;
    if (priceMatch) {
        price = parseInt(priceMatch[1]);
    } else {
        console.warn(`Warning: Could not parse price from "${priceStr}". Setting to null.`);
    }
    
    items.push({ name, imageUrl, price });
}

// Categorize items based on name patterns
function categorize(name) {
    const n = name.toLowerCase();
    
    // Desserts
    if (['apricot delight','double ka meetha','gulab jamun','rasmalai','sizzling brownie',
         'molten cheese cake','chocolate bomb','pudding','chocolate mousse','chocolate lava cake',
         'caramel custard'].some(d => n.includes(d.toLowerCase()))) return 'DESSERTS';
    
    // Drinks
    if (['virgin mojito','mint lemonade','strawberry delight','berry spritzer','citrus blast']
        .some(d => n.includes(d.toLowerCase()))) return 'DRINKS';
    
    // Biryani
    if (n.includes('biriyani') || n.includes('biryani')) return 'BIRYANI';
    
    // Fried Rice
    if (n.includes('fried rice')) return 'FRIED RICE';
    
    // Breads
    if (['tandoori roti','butter naan','rumali roti','parotta','aloo parotta',
         'mixed veg parotta','veg kulcha','paneer kulcha','mushroom kulcha',
         'garlic naan','plain naan'].some(b => n.includes(b.toLowerCase()))) return 'BREADS';
    
    // Starters
    if (['crispy corn','french fries','chilly potato','bullets','spring rolls',
         'chilli mushroom','paneer tikka','gobhi 65','veg manchuria','veg honk kong',
         'baby corn manchuria','crispy veg','chilli paneer','pasta',
         'chicken 65','chicken lollipop','chilli chicken','chicken manchuria',
         'chicken kabab','chicken malai','tandoori chicken','fish fry tikka',
         'lamb tikka','tandoori fish','tandoori shrimp','chilli fish','chilli shrimp',
         'egg kheema'].some(s => n.toLowerCase() === s.toLowerCase() || n.includes(s.toLowerCase()))) return 'STARTERS';
    
    // Curries (default for remaining)
    return 'CURRIES';
}

function getType(name) {
    const n = name.toLowerCase();
    // Egg items
    if (n.startsWith('egg')) return 'nonveg';
    // Chicken
    if (n.includes('chicken') || n.includes('butter chicken')) return 'nonveg';
    // Mutton
    if (n.includes('mutton') || n.includes('lamb')) return 'nonveg';
    // Fish/Seafood
    if (n.includes('fish') || n.includes('prawns') || n.includes('prawn') || 
        n.includes('shrimp') || n.includes('crab')) return 'nonveg';
    // Tandoori (without veg qualifier)
    if (n.includes('tandoori') && !n.includes('roti')) return 'nonveg';
    
    return 'veg';
}

const menuItems = items.map((item, idx) => ({
    id: idx + 1,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    category: categorize(item.name),
    type: getType(item.name)
}));

console.log(`Total items parsed: ${menuItems.length}`);
console.log('\nCategories:');
const cats = {};
menuItems.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
console.log(cats);

// Output as JSON
fs.writeFileSync('./parsed_items.json', JSON.stringify(menuItems, null, 2));
console.log('\nSaved to parsed_items.json');
