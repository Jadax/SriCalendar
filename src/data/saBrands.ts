export interface SaBrand {
  name: string;
  country: 'ZA' | 'international';
  category: BrandCategory;
  subcategory: string;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  contactMethod: 'email' | 'dm' | 'form' | 'manager' | 'agency';
  outreachDifficulty: 'easy' | 'medium' | 'hard';
  typicalBudget: 'gifted' | 'micro' | 'mid' | 'premium';
  keyProducts: string[];
  keyEvents: string[];
  notes: string;
  readyToSendMessage: string;
}

export type BrandCategory =
  | 'skincare'
  | 'haircare'
  | 'makeup'
  | 'nails'
  | 'wellness'
  | 'fragrance'
  | 'body_care'
  | 'retailers'
  | 'salons_spa'
  | 'fitness'
  | 'supplements'
  | 'men_grooming';

export const BRAND_CATEGORIES: { id: BrandCategory; label: string; icon: string }[] = [
  { id: 'skincare', label: 'Skincare', icon: '🧴' },
  { id: 'haircare', label: 'Haircare', icon: '💇' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'nails', label: 'Nails', icon: '💅' },
  { id: 'body_care', label: 'Body Care', icon: '🫧' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'fragrance', label: 'Fragrance', icon: '🌸' },
  { id: 'supplements', label: 'Supplements', icon: '💊' },
  { id: 'fitness', label: 'Fitness', icon: '🏋️' },
  { id: 'men_grooming', label: "Men's Grooming", icon: '🧔' },
  { id: 'salons_spa', label: 'Salons & Spas', icon: '💆' },
  { id: 'retailers', label: 'Retailers', icon: '🛍️' },
];

export const CONTACT_METHODS: Record<SaBrand['contactMethod'], { label: string; tip: string }> = {
  email: { label: 'Email', tip: 'Send a short, personalised email. Reference a specific product or campaign. Under 120 words.' },
  dm: { label: 'Instagram DM', tip: 'Short, casual, reference a specific post. Move to email after interest confirmed.' },
  form: { label: 'Website Form', tip: 'Fill their creator/influencer application form. Include media kit link.' },
  manager: { label: 'Manager/Agent', tip: 'Find manager in bio or website. Email them directly with formal pitch.' },
  agency: { label: 'Agency', tip: 'Contact their marketing agency. Professional email with media kit attached.' },
};

export const OUTREACH_DIFFICULTY: Record<SaBrand['outreachDifficulty'], { label: string; color: 'mint' | 'yellow' | 'coral' }> = {
  easy: { label: 'Easy', color: 'mint' },
  medium: { label: 'Medium', color: 'yellow' },
  hard: { label: 'Hard', color: 'coral' },
};

export const BUDGET_TIERS: Record<SaBrand['typicalBudget'], { label: string; range: string }> = {
  gifted: { label: 'Gifted', range: 'Free product only' },
  micro: { label: 'Micro', range: 'R1,000 – R5,000' },
  mid: { label: 'Mid', range: 'R5,000 – R25,000' },
  premium: { label: 'Premium', range: 'R25,000+' },
};

/** Complete creator workflow from ideation to payment. */
export const CREATOR_WORKFLOW = [
  { step: 1, title: 'Research & Ideation', icon: '🔍', description: 'Find trending topics, check what competitors are doing, identify gaps in your niche.', timeframe: '15–30 min' },
  { step: 2, title: 'Script & Plan', icon: '📝', description: 'Write your hook, structure, and key talking points. Use the Script Writer.', timeframe: '20–45 min' },
  { step: 3, title: 'Film', icon: '🎬', description: 'Record your content. Multiple takes are normal. Good lighting is everything.', timeframe: '30–90 min' },
  { step: 4, title: 'Edit', icon: '✂️', description: 'Cut to the beat, add captions (80% watch muted), trending audio, text overlays.', timeframe: '45–120 min' },
  { step: 5, title: 'Optimise & Post', icon: '📤', description: 'Hook caption, 5–10 hashtags, tag brand, schedule for peak time.', timeframe: '10–20 min' },
  { step: 6, title: 'Engage', icon: '💬', description: 'Reply to every comment in first hour. Share to Stories with a poll.', timeframe: '15–30 min' },
  { step: 7, title: 'Track & Learn', icon: '📊', description: 'Check analytics after 24h, 48h, 7d. Note what worked. Iterate.', timeframe: '10–15 min' },
  { step: 8, title: 'Pitch & Get Paid', icon: '💰', description: 'Update portfolio, send personalised outreach, negotiate, invoice.', timeframe: 'Ongoing' },
];

/** South African beauty, wellness & haircare brands — verified July 2026. */
export const SA_BRANDS: SaBrand[] = [
  // ═══════════════════════════════════════════════════════════════
  // 🇿🇦 SOUTH AFRICAN RETAILERS
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Clicks', country: 'ZA', category: 'retailers', subcategory: 'Pharmacy & beauty retail',
    website: 'clicks.co.za', instagram: '@clicks_sa', tiktok: '@clicks_sa', email: 'influencer@clicks.co.za',
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'mid',
    keyProducts: ['Clicks Hair Care range', 'Framoil skincare', 'Botanics range', 'Clicks Derma range'],
    keyEvents: ['Clicks Beauty Playground (annual, Nov)', 'Clicks Beauty Hub activations'],
    notes: 'SA largest health & beauty retailer. Own brands include Framoil, Botanics. Hosts annual Beauty Playground event.',
    readyToSendMessage: `Hi Clicks Team 👋

I am a UGC creator specialising in beauty and skincare content on TikTok and Instagram. I have been a loyal Clicks customer for years and would love to create authentic content featuring your own-brand ranges — especially the Derma and Botanics lines.

I create honest, relatable product reviews and my audience loves affordable beauty finds. I recently did a Clicks haul video that got great engagement and I would love to collaborate officially.

Would you be open to sending me a few products to try? I can create a full review reel or TikTok. No scripts — just honest content.

My media kit and recent work: [LINK]

Thanks so much!
[YOUR NAME]
[YOUR HANDLE] | [YOUR EMAIL]`,
  },
  {
    name: 'Dis-Chem', country: 'ZA', category: 'retailers', subcategory: 'Pharmacy & beauty retail',
    website: 'dischem.co.za', instagram: '@dischem', tiktok: '@dischem', email: 'marketing1@dischem.co.za',
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'mid',
    keyProducts: ['Dis-Chem Glam Crew programme', 'Clicks exclusive brands', 'Dis-Chem Benefit Card promotions'],
    keyEvents: ['Dis-Chem Glam Crew (always-on influencer programme)', 'Dis-Chem Beauty Festival'],
    notes: 'Major pharmacy chain. Has the "Dis-Chem Glam Crew" influencer programme. Contact their social media team or apply via their website.',
    readyToSendMessage: `Hi Dis-Chem Team 👋

I have been following the Dis-Chem Glam Crew and I love the content the creators are putting out. I would love to be part of it.

I am a beauty UGC creator with [NUMBER] followers on [PLATFORM]. I specialise in skincare and haircare content and my audience is mostly women aged 18–34 in South Africa.

I recently created a Dis-Chem haul video featuring [PRODUCT] and it performed really well. I would love to create more content for you — honest reviews, routines, and product comparisons.

Would you be open to a quick chat about the Glam Crew programme?

My portfolio: [LINK]

Thanks!
[YOUR NAME]
[YOUR HANDLE] | [YOUR EMAIL]`,
  },
  {
    name: 'Woolworths', country: 'ZA', category: 'retailers', subcategory: 'Premium retail',
    website: 'woolworths.co.za', instagram: '@woolworths_sa', tiktok: '@woolworths_sa', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Woolworths Beauty own brand', 'Natio range', 'Charlotte Rhys', 'EcoTools'],
    keyEvents: ['Woolworths Beauty events', 'Woolworths Food + Beauty pairing events'],
    notes: 'Premium SA retailer. Uses agencies for influencer campaigns. High production value expected.',
    readyToSendMessage: `Hi Woolworths Team 👋

I am a beauty content creator and a huge fan of the Woolworths beauty edit. I recently discovered the Charlotte Rhys range through your store and it has become a staple.

I create aspirational but relatable beauty content on [PLATFORM] with [NUMBER] followers. My aesthetic matches the Woolworths brand — clean, elevated, and quality-focused.

I would love to create content featuring your beauty Edit or any new launches. Happy to send my media kit and a content plan.

Would you be open to chatting?

Best,
[YOUR NAME]
[YOUR HANDLE] | [YOUR EMAIL]`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 🇿🇦 SA SKINCARE BRANDS
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Environ', country: 'ZA', category: 'skincare', subcategory: 'Professional skincare',
    website: 'environskincare.com', instagram: '@environskincare', tiktok: null, email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Vitamin A step-up system', 'REVOSTATIN', 'Antioxidant Defence Crème'],
    keyEvents: ['Environ World Congress', 'Environ stockist events'],
    notes: 'Premium SA skincare. Vitamin A focus. Professional-only range. Works through distributor network.',
    readyToSendMessage: `Hi Environ Team 👋

I am a skincare-focused UGC creator and I have been researching professional-grade skincare for my audience. The Environ Vitamin A step-up system fascinates me — the science behind it is incredible.

I create educational skincare content explaining ingredients and routines. My audience loves learning about what actually works vs marketing hype.

I would love to create a "dermatologist-grade skincare explained" video featuring Environ. I can break down the step-up system in a way that is easy to understand.

Would you be open to sending me some products to try and review?

My recent skincare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Lamelle', country: 'ZA', category: 'skincare', subcategory: 'Professional skincare',
    website: 'lamelleskinscience.co.za', instagram: '@lamelleskinscience', tiktok: null, email: null,
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'mid',
    keyProducts: ['Helase range', 'Corrective range', 'Nourish range'],
    keyEvents: ['Lamelle stockist training events'],
    notes: 'SA professional skincare. Peptides + ceramides. Educator-led approach.',
    readyToSendMessage: `Hi Lamelle Team 👋

I am a skincare creator passionate about science-backed skincare. The Lamelle Corrective range is something my audience keeps asking about — especially the peptide technology.

I create ingredient-education content and my followers love understanding the science behind skincare. I would love to create a "professional skincare explained" series featuring Lamelle.

My recent skincare content: [LINK]

Would you be open to a collaboration?

Best,
[YOUR NAME]`,
  },
  {
    name: 'Optiphi', country: 'ZA', category: 'skincare', subcategory: 'Premium skincare',
    website: 'optiphi.com', instagram: '@optiphi', tiktok: null, email: null,
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'mid',
    keyProducts: ['Classic Glow range', 'Revitalise range', 'Moisture-lock range'],
    keyEvents: ['Optiphi stockist events'],
    notes: 'Premium SA skincare. Unique colour-coded system. Educational approach.',
    readyToSendMessage: `Hi Optiphi Team 👋

I love the colour-coded system Optiphi uses — it makes choosing products so easy. I am a UGC creator specialising in skincare content and I think the Optiphi system would be perfect for my audience.

I create "skincare routine" content and "product breakdown" videos. The colour-coded system is exactly the kind of thing my audience responds to — simple, visual, and effective.

Would you be open to sending me a few products to try?

My recent skincare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Skin Functional', country: 'ZA', category: 'skincare', subcategory: 'Active skincare',
    website: 'skinfunctional.co.za', instagram: '@skinfunctional', tiktok: '@skinfunctional', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Niacinamide 10% + Zinc 1%', 'Retinol 0.5%', 'AHA/BHA Exfoliant', 'Vitamin C 20%'],
    keyEvents: ['Skin Functional social media campaigns'],
    notes: 'Affordable actives. Very creator-friendly. DM their social account directly.',
    readyToSendMessage: `Hi Skin Functional 👋

I love what you are doing with affordable active ingredients! The Niacinamide serum is a staple in my routine and my audience keeps asking for more content about it.

I am a skincare UGC creator with [NUMBER] followers. I create "affordable skincare routine" content and I would love to feature more Skin Functional products.

Would you be open to sending me a few products to try? I can create honest reviews and routine videos.

My recent content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Oh So Heavenly', country: 'ZA', category: 'body_care', subcategory: 'Body & skincare',
    website: 'ohsoheavenly.co.za', instagram: '@ohsoheavenlysa', tiktok: '@ohsoheavenlysa', email: 'info@ohsoheavenly.co.za',
    contactMethod: 'email', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Gift sets', 'Body butter range', 'Lip balm range'],
    keyEvents: ["Valentine's Day gift sets", "Mother's Day collections", 'Holiday gift guides'],
    notes: 'SA mass-market body & skincare. Gift sets are very popular for seasonal content.',
    readyToSendMessage: `Hi Oh So Heavenly Team 👋

I am a UGC creator and I absolutely love your gift sets — they are always my go-to for gifting content! The packaging is so beautiful and my audience goes crazy for them.

I create "gift guide" and "self-care routine" content on [PLATFORM]. I would love to feature Oh So Heavenly in my upcoming [SEASON] gift guide.

Would you be open to sending me a few products to include? I can create unboxing and routine content.

My recent gift guide content: [LINK]

Thanks!
[YOUR NAME]`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 🇿🇦 SA HAIRCARE BRANDS
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Candi & Co', country: 'ZA', category: 'haircare', subcategory: 'Natural haircare',
    website: 'candiandco.co.za', instagram: '@candiandco', tiktok: '@candiandco', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Curl Define range', 'Moisture range', 'Edge control'],
    keyEvents: ['Candi & Co social media campaigns'],
    notes: 'SA natural hair brand. Curl specialist. Very creator-friendly.',
    readyToSendMessage: `Hi Candi & Co 👋

I have been following your curl range and I love how you celebrate natural hair! I am a natural hair creator with [NUMBER] followers and my audience is always looking for curl products that actually work.

I create wash day routines, styling tutorials, and product reviews. I would love to feature Candi & Co in my next natural hair content.

Would you be open to sending me a few products to try?

My recent hair content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Ultimaze', country: 'ZA', category: 'haircare', subcategory: 'Hair growth',
    website: null, instagram: '@ultimaze_hair', tiktok: '@ultimaze_hair', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Hair growth oil', 'Edge growth serum', 'Scalp treatment'],
    keyEvents: ['Hair growth challenge campaigns'],
    notes: 'SA hair growth brand. Loves "hair growth journey" content.',
    readyToSendMessage: `Hi Ultimaze 👋

I am starting a hair growth journey and I have heard amazing things about your products! I am a natural hair UGC creator with [NUMBER] followers.

I would love to document my hair growth journey using Ultimaze products — day-by-day progress, honest reviews, the whole thing. My audience loves transformation content.

Would you be open to sending me products to try for a 30-day challenge?

My hair content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Sorbet', country: 'ZA', category: 'salons_spa', subcategory: 'Salon chain',
    website: 'sorbet.co.za', instagram: '@sorbetdaily', tiktok: '@sorbetdaily', email: 'info@sorbet.co.za',
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'mid',
    keyProducts: ['Sorbet skincare range', 'Sorbet Man range', 'Sorbet Nails'],
    keyEvents: ['Sorbet salon events', 'Sorbet product launches'],
    notes: 'Homegrown SA salon chain. Aspirational but relatable content works best.',
    readyToSendMessage: `Hi Sorbet Team 👋

I am a beauty UGC creator and I love the Sorbet experience — from the salon to the skincare range. I recently visited your [LOCATION] branch and the experience was incredible.

I create "beauty experience" content — salon visits, product reviews, and self-care routines. I would love to create a "Sorbet experience" video for my audience.

Would you be open to a collaboration? I can visit a branch and create authentic content about the experience.

My recent beauty content: [LINK]

Thanks!
[YOUR NAME]`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 🇿🇦 SA BODY CARE & WELLNESS
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'Rain Africa', country: 'ZA', category: 'body_care', subcategory: 'African body care',
    website: 'rainafrica.com', instagram: '@rainafrica', tiktok: '@rainafrica', email: 'info@rainafrica.com',
    contactMethod: 'email', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['African Butter range', ' Shea range', 'Gift sets'],
    keyEvents: ['Rain Africa store events'],
    notes: 'SA luxury body care. African botanicals. Gift focus. Very open to gifting.',
    readyToSendMessage: `Hi Rain Africa 👋

I love what you do with African botanicals! The African Butter range is incredible and I have been using it for months. I am a UGC creator specialising in self-care content.

I create "luxury self-care" and "African beauty" content on [PLATFORM]. I would love to feature Rain Africa in a "self-care routine" video — the products are so beautiful on camera.

Would you be open to sending me a few products to include in my content?

My recent self-care content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Evolus', country: 'ZA', category: 'wellness', subcategory: 'Adaptogens',
    website: 'evolus.co.za', instagram: '@evolus_sa', tiktok: '@evolus_sa', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Adaptogen blends', 'Nootropic drinks', 'Focus supplements'],
    keyEvents: ['Evolus wellness events'],
    notes: 'SA functional wellness. Adaptogens + nootropics. Very creator-friendly.',
    readyToSendMessage: `Hi Evolus 👋

I have been curious about adaptogens and nootropics for a while! I am a wellness UGC creator and my audience is always asking about focus and energy supplements.

I create "morning routine" and "wellness stack" content. I would love to try your products and create an honest review — showing my actual routine with Evolus.

Would you be open to sending me a few products to try?

My wellness content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Sfera', country: 'ZA', category: 'supplements', subcategory: 'Wellness supplements',
    website: 'sfera.co.za', instagram: '@sfera_sa', tiktok: '@sfera_sa', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Collagen range', 'Probiotics', 'Omega-3', 'Vitamin D'],
    keyEvents: ['Sfera wellness campaigns'],
    notes: 'SA wellness supplements. Clean label. Very creator-friendly.',
    readyToSendMessage: `Hi Sfera 👋

I have been looking for clean, quality supplements and your range looks perfect! I am a wellness UGC creator with [NUMBER] followers.

I create "wellness routine" and "supplement stack" content. My audience is always asking what supplements I take — I would love to feature Sfera in my routine.

Would you be open to sending me a few products to try and review honestly?

My wellness content: [LINK]

Thanks!
[YOUR NAME]`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌐 INTERNATIONAL BRANDS (Available in SA)
  // ═══════════════════════════════════════════════════════════════
  {
    name: 'The Ordinary', country: 'international', category: 'skincare', subcategory: 'Active skincare',
    website: 'theordinary.com', instagram: '@theordinary', tiktok: '@theordinary', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Niacinamide 10% + Zinc 1%', 'AHA 30% + BHA 2% Peeling Solution', 'Hyaluronic Acid 2% + B5', 'Retinol 0.5% in Squalane'],
    keyEvents: ['DECIEM The Ordinary social campaigns'],
    notes: 'DECIEM brand. Cult following. SA stockists via Clicks/Dis-Chem. Works through Nuffield agency.',
    readyToSendMessage: `Hi The Ordinary Team 👋

I am obsessed with the Niacinamide serum — it literally changed my skin. I am a skincare UGC creator and my audience asks about The Ordinary every single day.

I create "affordable actives" content — comparing products, explaining ingredients, showing real results. The Ordinary is the brand I recommend most.

I would love to create an "Ultimate The Ordinary Routine" video — layering the products, showing the correct order, explaining what each one does. My audience would go crazy for it.

Would you be open to collaborating? I can send my media kit and content plan.

My skincare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'CeraVe', country: 'international', category: 'skincare', subcategory: 'Gentle skincare',
    website: 'cerave.com', instagram: '@cerave', tiktok: '@cerave', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Foaming Facial Cleanser', 'Moisturising Cream', 'SA Smoothing Cleanser', 'AM Facial Moisturising Lotion SPF 30'],
    keyEvents: ['CeraVe TikTok Creator Awards', 'CeraVe social campaigns'],
    notes: 'L\'Oréal. Ceramide-focused. Huge TikTok presence. SA managed by Caroline Khumalo at L\'Oréal. Works through Styling Concepts PR agency.',
    readyToSendMessage: `Hi CeraVe Team 👋

I am a huge fan of the Foaming Facial Cleanser — it is the only cleanser that does not break me out! I am a skincare UGC creator and CeraVe is the brand my audience trusts most.

I create "dermatologist-recommended" content — routines, ingredient breakdowns, product comparisons. CeraVe is always in my recommendations.

I would love to create a "CeraVe for [skin type]" video — showing the full routine, explaining ceramides, and comparing to other brands. I know my audience would save and share it.

Would you be open to a collaboration?

My skincare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Garnier', country: 'international', category: 'skincare', subcategory: 'Mass skincare',
    website: 'garnier.co.za', instagram: '@garnierafrica', tiktok: '@garnierafrica', email: null,
    contactMethod: 'agency', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Garnier Vitamin C Serum', 'Micellar Water', 'Bright Complete range', 'Hair Food masks'],
    keyEvents: ['Garnier Beauty University', 'Garnier social campaigns'],
    notes: 'L\'Oréal mass brand. Works through Dentsu Creative agency. SA influencer marketing executive handles partnerships.',
    readyToSendMessage: `Hi Garnier Team 👋

I have been using the Vitamin C Serum for months and my skin has never looked brighter! I am a skincare UGC creator and Garnier is one of the brands I recommend most — the value for money is incredible.

I create "affordable skincare" content — routines, before/afters, product comparisons. The Garnier Vitamin C range is always in my "best budget skincare" videos.

I would love to create a "Garnier Bright Complete routine" video — showing the full range, how to use each product, and real results.

Would you be open to a collaboration?

My skincare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Nivea', country: 'international', category: 'skincare', subcategory: 'Mass skincare',
    website: 'nivea.co.za', instagram: '@nivea_sa', tiktok: '@nivea_sa', email: null,
    contactMethod: 'agency', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Nivea Soft range', 'Nivea Sun range', 'Nivea Q10 range', 'Nivea Men range'],
    keyEvents: ['Nivea TikTok Creator Awards', 'Beiersdorf TikTok Creator Awards', 'I AM #1 campaign'],
    notes: 'Beiersdorf. Huge SA presence. Works through Dentsu Creative. Has "I AM #1" campaign featuring Uncle Waffles, Zozibini Tunzi.',
    readyToSendMessage: `Hi Nivea Team 👋

I saw the "I AM #1" campaign with Uncle Waffles and it was so inspiring! I am a beauty UGC creator and I love how Nivea celebrates real people.

I create "everyday beauty" content — simple routines, honest reviews, and relatable beauty moments. Nivea is the brand my mom uses and I grew up with — it has real sentimental value.

I would love to create a "Nivea routine for [skin type]" video — showing the Q10 range or the Sun range. My audience loves products that are affordable and actually work.

Would you be open to a collaboration?

My beauty content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'La Roche-Posay', country: 'international', category: 'skincare', subcategory: 'Dermocosmetics',
    website: 'laroche-posay.co.za', instagram: '@laroche_posay_sa', tiktok: null, email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Anthelios Sun range', 'Effaclar range', 'Toleriane range', 'Hyalu B5 serum'],
    keyEvents: ['La Roche-Posay UV Air campaign', '50 years celebration events'],
    notes: 'L\'Oréal Active Cosmetics. Works through Styling Concepts PR. Marketing manager is Caroline Khumalo. Recently celebrated 50 years.',
    readyToSendMessage: `Hi La Roche-Posay Team 👋

I saw the UV Air campaign and loved how it made sunscreen feel light and wearable. I am a skincare UGC creator and sunscreen education is a big part of my content.

I create "SPF education" content — explaining UV protection, showing how to apply properly, and reviewing sunscreens. La Roche-Posay Anthelios is always my top recommendation.

I would love to create a "sunscreen deep dive" video featuring the UV Air range — comparing textures, showing white cast tests, and explaining the SPF technology.

Would you be open to a collaboration?

My sunscreen content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Cetaphil', country: 'international', category: 'skincare', subcategory: 'Gentle skincare',
    website: 'cetaphil.co.za', instagram: '@cetaphil_sa', tiktok: '@cetaphil_sa', email: null,
    contactMethod: 'dm', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Gentle Skin Cleanser', 'Moisturising Lotion', 'Bright Healthy Radiance range'],
    keyEvents: ['Cetaphil social campaigns'],
    notes: 'Dermatologist recommended. Sensitive skin focus. SA TikTok account is active.',
    readyToSendMessage: `Hi Cetaphil SA 👋

I have sensitive skin and the Gentle Skin Cleanser is the only cleanser that does not irritate it. I am a skincare UGC creator and my audience with sensitive skin always asks for gentle product recommendations.

I create "sensitive skin routine" content — gentle products, barrier repair, and calming routines. Cetaphil is always in my recommendations.

I would love to create a "sensitive skin holy grail" video featuring Cetaphil. My audience would love it.

Would you be open to sending me a few products to feature?

My sensitive skin content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Dove', country: 'international', category: 'body_care', subcategory: 'Mass body care',
    website: 'dove.com', instagram: '@dovesouthafrica', tiktok: '@dovesouthafrica', email: null,
    contactMethod: 'dm', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Dove Body Wash', 'Dove Beauty Bar', 'Dove Hair range', 'Dove Cera Glow range'],
    keyEvents: ['Dove Creator Collective (always-on programme)', 'Dove Masterclass events', '#SkinThatDoves campaign'],
    notes: 'Unilever. Has the #DoveCreatorCollective programme. Creators with 1,500–15,000 followers on Instagram and 1,000–15,000 on TikTok in JHB, CPT, DBN can apply.',
    readyToSendMessage: `Hi Dove SA 👋

I love the #DoveCreatorCollective initiative — the focus on authenticity and real beauty is exactly what I stand for as a creator.

I am a beauty UGC creator with [NUMBER] followers on [PLATFORM]. My content focuses on real, relatable beauty — no filters, no pressure, just honest reviews and self-care moments.

I would love to be part of the Dove Creator Collective. I create content that celebrates real beauty and I think my audience would connect with Dove's message.

Would you be open to chatting about the programme?

My content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'The Body Shop', country: 'international', category: 'body_care', subcategory: 'Ethical body care',
    website: 'thebodyshop.co.za', instagram: '@thebodyshop_sa', tiktok: '@thebodyshop_sa', email: null,
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Shea Butter range', 'Vitamin E range', 'Tea Tree range', 'Body Butters'],
    keyEvents: ['Body Shop ethical campaigns', 'Cruelty-free awareness events'],
    notes: 'Ethical brand heritage. Loves sustainability messaging.',
    readyToSendMessage: `Hi The Body Shop Team 👋

I love The Body Shop's commitment to ethical beauty — it is something I care deeply about as a creator. The Shea Butter Body Butter is my absolute favourite.

I create "ethical beauty" content — cruelty-free products, sustainable beauty, and conscious consumerism. I would love to feature The Body Shop in my "ethical beauty favourites" video.

Would you be open to a collaboration? I can create content that highlights your ethical values and product quality.

My ethical beauty content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Bath & Body Works', country: 'international', category: 'body_care', subcategory: 'Fragrance body care',
    website: 'bathandbodyworks.co.za', instagram: '@bathandbodyworks_sa', tiktok: '@bathandbodyworks_sa', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Hand Soaps', 'Body Lotions', 'Candles', 'Mists'],
    keyEvents: ['Seasonal launches (Fall, Winter, Holiday)', 'Semi-annual sale'],
    notes: 'L Brands. Hand soaps + body care. Scent focus. Loves seasonal content.',
    readyToSendMessage: `Hi Bath & Body Works 👋

I am obsessed with your candles and hand soaps! The [SEASON] collection is incredible. I am a lifestyle UGC creator and scent content is some of my most engaging.

I create "scent of the day" and "home fragrance" content — candle collections, hand soap reviews, and seasonal favourites. Bath & Body Works is always my top recommendation.

Would you be open to sending me a few products from the [SEASON] collection to feature? My audience would love it.

My scent content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Olaplex', country: 'international', category: 'haircare', subcategory: 'Bond repair',
    website: 'olaplex.com', instagram: '@olaplex', tiktok: '@olaplex', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['No. 3 Hair Perfector', 'No. 4 Bond Maintenance Shampoo', 'No. 5 Bond Maintenance Conditioner', 'No. 7 Bonding Oil'],
    keyEvents: ['Olaplex social campaigns'],
    notes: 'Bond repair technology. Works through US agency. Transformation content performs best.',
    readyToSendMessage: `Hi Olaplex Team 👋

The No. 3 Hair Perfector literally saved my damaged hair. I bleached it too much and Olaplex brought it back to life. I am a haircare UGC creator and my audience asks about bond repair constantly.

I create "hair transformation" content — before/afters, damage repair routines, and product reviews. Olaplex is the brand I recommend most for damaged hair.

I would love to create a "Olaplex full routine" video — showing No. 3 through No. 7, how to layer them, and real results. My audience would save it immediately.

Would you be open to a collaboration?

My haircare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Mielle', country: 'international', category: 'haircare', subcategory: 'Natural haircare',
    website: 'mielleorganics.com', instagram: '@mielleorganics', tiktok: '@mielleorganics', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Rosemary Mint Scalp & Hair Strengthening Oil', 'Pomegranate & Honey range', 'Babassu Oil range'],
    keyEvents: ['Mielle social campaigns'],
    notes: 'P&G acquired. Rosemary mint oil went viral. Transformation content works best.',
    readyToSendMessage: `Hi Mielle Team 👋

The Rosemary Mint Oil changed my hair growth journey! I have been using it for [NUMBER] months and the results are incredible. I am a natural hair UGC creator and my audience is obsessed with this product.

I create "hair growth journey" content — documenting progress, showing routines, and reviewing products honestly. Mielle is the brand I recommend most for hair growth.

I would love to create a "30-day Mielle challenge" video — showing my actual hair growth progress. My audience would be so invested.

Would you be open to a collaboration?

My hair growth content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Cantu', country: 'international', category: 'haircare', subcategory: 'Natural haircare',
    website: 'cantuauty.com', instagram: '@cantuauty', tiktok: '@cantuauty', email: null,
    contactMethod: 'dm', outreachDifficulty: 'easy', typicalBudget: 'gifted',
    keyProducts: ['Shea Butter Leave-In Conditioning Repair Cream', 'Coconut Curling Cream', 'Apple Cider Vinegar Rinse'],
    keyEvents: ['Cantu social campaigns'],
    notes: 'Church & Dwight. Shea butter haircare. Affordable. Very creator-friendly.',
    readyToSendMessage: `Hi Cantu 👋

The Shea Butter Leave-In is a staple in my natural hair routine! I am a natural hair UGC creator and Cantu is the brand I recommend most — affordable and actually works.

I create "wash day routine" and "natural hair on a budget" content. Cantu is always in my "best affordable hair products" videos.

Would you be open to sending me a few products to feature in my next wash day video?

My natural hair content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Adwoa Beauty', country: 'international', category: 'haircare', subcategory: 'Natural haircare',
    website: 'adwoabeauty.com', instagram: '@adwoabeauty', tiktok: '@adwoabeauty', email: null,
    contactMethod: 'dm', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Baomint Moisturizing Scalp Oil', 'Baomint Deeply Define Curl Cream', 'Sweet AlmondOil'],
    keyEvents: ['Adwoa Beauty social campaigns'],
    notes: 'Baomint scalp oil went viral. Clean beauty. Creator-friendly.',
    readyToSendMessage: `Hi Adwoa Beauty 👋

The Baomint Scalp Oil is one of the best products I have ever used — the cooling sensation and the growth results are incredible! I am a natural hair UGC creator.

I create "scalp care routine" and "hair growth" content. The Baomint line is perfect for my audience — they love products that are both effective and feel amazing.

Would you be open to sending me a few products to feature? I can create a "scalp care routine" video that would really resonate.

My haircare content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Dyson', country: 'international', category: 'haircare', subcategory: 'Hair tools',
    website: 'dyson.co.za', instagram: '@dyson', tiktok: '@dyson', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Dyson Airwrap', 'Dyson Supersonic', 'Dyson Corrale'],
    keyEvents: ['Dyson product launches', 'Dyson beauty events'],
    notes: 'Premium tools. Works through UK agency. High production value expected.',
    readyToSendMessage: `Hi Dyson Team 👋

I have been saving up for an Airwrap because I see it everywhere and I KNOW my audience would love a honest review. I am a haircare UGC creator with [NUMBER] followers.

I create "tool review" content — testing hair tools, showing results, and comparing to alternatives. I would love to create a "Dyson Airwrap: Is It Worth It?" video — honest, thorough, and showing real results on [hair type] hair.

Would you be open to sending me an Airwrap to review? I can create multiple pieces of content — full review, quick tips, and comparison videos.

My tool review content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Fenty Beauty', country: 'international', category: 'makeup', subcategory: 'Inclusive makeup',
    website: 'fentybeauty.com', instagram: '@fentybeauty', tiktok: '@fentybeauty', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Pro Filt\'r Foundation', 'Gloss Bomb', 'Stunna Lip Paint', 'Cheeks Out Blush'],
    keyEvents: ['Fenty Beauty launches', 'Savage X Fenty shows'],
    notes: 'Rihanna. Inclusive shade range. Works through LVMH agency. SA stockists via Arcadia.',
    readyToSendMessage: `Hi Fenty Beauty Team 👋

Rihanna changed the game with the shade range — finally a brand that gets it! I am a makeup UGC creator and Fenty is the brand I recommend for inclusive beauty.

I create "inclusive beauty" content — shade matching, honest reviews, and tutorials for all skin tones. Fenty is always in my "best foundation for [skin type]" videos.

I would love to create a "Fenty shade match" video — showing the range, finding my exact shade, and reviewing the formula. My audience would love it.

Would you be open to a collaboration?

My makeup content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Maybelline', country: 'international', category: 'makeup', subcategory: 'Mass makeup',
    website: 'maybelline.co.za', instagram: '@maybelline', tiktok: '@maybelline', email: null,
    contactMethod: 'email', outreachDifficulty: 'medium', typicalBudget: 'micro',
    keyProducts: ['Fit Me Foundation', 'Lash Sensational Mascara', 'Sky High Mascara', 'SuperStay Matte Ink'],
    keyEvents: ['Maybelline social campaigns', 'New product launches'],
    notes: 'L\'Oréal. #1 mass makeup globally. SA runs local influencer campaigns.',
    readyToSendMessage: `Hi Maybelline Team 👋

The Sky High Mascara is literally the best mascara I have ever used — and I have tried EVERYTHING. I am a makeup UGC creator and Maybelline is the brand I recommend most for affordable beauty.

I create "drugstore makeup" content — affordable routines, product comparisons, and honest reviews. Maybelline is always in my "best budget makeup" videos.

I would love to create a "Full face using only Maybelline" video — foundation, concealer, mascara, lips, everything. My audience would save it immediately.

Would you be open to sending me a few products to feature?

My makeup content: [LINK]

Thanks!
[YOUR NAME]`,
  },
  {
    name: 'Charlotte Tilbury', country: 'international', category: 'makeup', subcategory: 'Luxury makeup',
    website: 'charlottetilbury.com', instagram: '@charlottetilbury', tiktok: '@charlottetilbury', email: null,
    contactMethod: 'agency', outreachDifficulty: 'hard', typicalBudget: 'premium',
    keyProducts: ['Pillow Talk Lipstick', 'Magic Cream', 'Airbrush Flawless Foundation', 'Hollywood Flawless Filter'],
    keyEvents: ['Charlotte Tilbury launches', 'Red carpet events'],
    notes: 'Puig. Pillow Talk franchise. Works through Puig agency.',
    readyToSendMessage: `Hi Charlotte Tilbury Team 👋

Pillow Talk is the lipstick that made me fall in love with makeup. The shade is perfection and the formula is incredible. I am a makeup UGC creator and Charlotte Tilbury is the brand I aspire to work with most.

I create "luxury makeup" content — high-end reviews, tutorials, and "is it worth it?" comparisons. Charlotte Tilbury is always in my "dream brand" list.

I would love to create a "Pillow Talk full routine" video — lipstick, blush, liner, the whole look. My audience would go crazy for it.

Would you be open to a collaboration?

My luxury makeup content: [LINK]

Thanks!
[YOUR NAME]`,
  },
];

/** Get brands filtered by country. */
export function getBrandsByCountry(country: 'ZA' | 'international'): SaBrand[] {
  return SA_BRANDS.filter((b) => b.country === country);
}

/** Get brands filtered by category. */
export function getBrandsByCategory(category: BrandCategory): SaBrand[] {
  return SA_BRANDS.filter((b) => b.category === category);
}

/** Search brands by name, notes, products, or strategy. */
export function searchBrands(query: string): SaBrand[] {
  const q = query.toLowerCase();
  return SA_BRANDS.filter((b) =>
    b.name.toLowerCase().includes(q) ||
    b.notes.toLowerCase().includes(q) ||
    b.subcategory.toLowerCase().includes(q) ||
    b.keyProducts.some((p) => p.toLowerCase().includes(q))
  );
}
