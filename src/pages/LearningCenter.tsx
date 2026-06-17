import React, { useState } from 'react';
import { Leaf, Award, Recycle, Flame, Compass, RefreshCw, BookmarkCheck, Newspaper, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LearningCenterProps {
  darkMode: boolean;
}

export default function LearningCenter({ darkMode }: LearningCenterProps) {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const ARTICLES = [
    {
      id: 1,
      category: "Reduce",
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      bg: "bg-rose-500/10",
      title: "Prevention First: Designing Out Single-Use Materials",
      readingTime: "5 min read",
      summary: "Explore the hierarchy of solid waste management by eliminating waste before it starts.",
      content: `The absolute peak of sustainable consumption (SDG 12) is Prevention. Designing out single-use materials entirely does not just prevent landfill volumes, it avoids the entire raw material extraction and shipping emissions. 

Key Action Pillars:
1. Re-use over Recycle: When a product is recycled, energy is consumed to shred, melt, and reformulate it into lower-grade compounds. When a bottle or container is refilled, that recycling footprint drops to absolute zero.
2. Minimize Over-packaging: Avoid items wrapped in triple layers of plastics and cardboard. Demand suppliers who ship packaging in biodegradable pulp boards.
3. Precycling Decisions: Think about disposal before buying. Ask: "How will this package leave my house? Can it be composted or continuously refilled?" If the answer is No, research plastic-free alternatives.`
    },
    {
      id: 2,
      category: "Reuse",
      icon: <Compass className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-500/10",
      title: "Upcycling Upgrades: Giving Discarded Objects New Purpose",
      readingTime: "4 min read",
      summary: "Understand upcycling, transformation mechanisms, and carbon retention methods.",
      content: `Upcycling is the creative mechanism of transforming discardable waste materials into products of higher quality or environmental utility. Uniquely, this retains the item's raw physical state and traps internal carbon instead of burning or composting.

Inspiring Transformation Actions:
- Glass Container Retentions: Large glass coffee jars and preserves make highly premium food storage, pencil sleeves, or air-tight propagation tubes.
- Corrugated Cardboard Card Shields: Cardboard boxes are high-grade weed suppressors in home gardens. Covering soil beds with plain cardboard kills weeds naturally without chemical sprays.
- Textile Reductions: Worn, shredded cotton t-shirts form ideal protective shock blankets or heavy polishing rags, replacing synthetic clean wipes that shed microplastics into sewer basins.`
    },
    {
      id: 3,
      category: "Recycle",
      icon: <Recycle className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-500/10",
      title: "Resin Numbers Demystified: The Standard Plastic Codes 1 - 7",
      readingTime: "6 min read",
      summary: "Unlock the secrets of the chasing recycling arrows stamped on plastic containers.",
      content: `A common eco-fallacy is that any plastic item stamped with the classic chasing arrows triangle is naturally recyclable. Those arrows enclose a Chasing Resin Identification Number (RIC) defining the underlying plastic polymer.

Decoding RICs for Correct Segregation:
1. RIC #1 - PET (Polyethylene Terephthalate): Found in soda, beverage, and peanut butter jars. Highly recyclable. Standard municipal centers collect these.
2. RIC #2 - HDPE (High-Density Polyethylene): Milk jugs, shampoo bottles, detergent jugs. Highly recyclable. Turn into pipes, pens, and plastic lumber.
3. RIC #3 - PVC (Polyvinyl Chloride): Pipes, cling wrap, toys. Extremely dangerous to incinerate or recycle due to toxic organochlorines. Seldom recycled.
4. RIC #4 - LDPE (Low-Density Polyethylene): Grocery squeezable bags, shrink wrap. Usually requires special bag-drop bins at grocery supermarkets. Do not throw into standard curbside bins.
5. RIC #5 - PP (Polypropylene): Yogurt tubs, medicine vials, bottle caps. Frequently recycled by specialized curbside collectors.
6. RIC #6 - PS (Polystyrene): Styrofoam, takeaway coffee cups. Extremely bulky, lightweight, and difficult to transport. Emits toxic styrene in incinerators. Landfills take these.
7. RIC #7 - Other/BPA/Polycarbonate: Bioplastics or composite resins. Very difficult to classify or recycle curbside.`
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      
      {/* Dynamic Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary">Eco-Learning Repository</h2>
        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
          Delve into comprehensive, verified environmental guides aligned with UN Sustainable Development Goal 12.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* TOPICS CARD LIST - Takes 5 cols on lg */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-natural-border/20">
            <Newspaper className="w-4.5 h-4.5 text-natural-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-natural-primary">Curated Guides</h3>
          </div>

          <div className="space-y-3.5">
            {ARTICLES.map((art) => {
              const active = selectedTopic === art.id;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedTopic(art.id)}
                  className={`w-full p-4.5 rounded-xl border text-left transition duration-200 cursor-pointer flex items-start space-x-4 shrink-0 ${
                    active 
                      ? 'border-natural-primary bg-natural-primary/5' 
                      : darkMode 
                        ? 'bg-natural-dark-card/40 border-natural-dark-border hover:border-natural-secondary' 
                        : 'bg-white border-natural-border hover:border-natural-secondary'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${art.bg}`}>
                    {art.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase mb-1">
                      <span className="text-natural-primary">{art.category}</span>
                      <span className="text-natural-muted">{art.readingTime}</span>
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-2">{art.title}</h4>
                    <p className={`text-xxs mt-1.5 line-clamp-2 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>{art.summary}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`p-5 rounded-2xl border text-xs leading-relaxed transition ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border text-natural-dark-muted' : 'bg-natural-sand border-natural-border text-natural-muted'}`}>
            <p className="font-bold mb-1.5 text-natural-primary flex items-center">
              <Award className="w-4 h-4 mr-1 shrink-0" />
              Empowerment Target Goal
            </p>
            <p>
              SDG Goal 12 demands that by 25% waste is processed with reuse schemes. By reading these articles and classifying materials via the AI scanner, users actively help divert physical metrics from regional micro-landfills.
            </p>
          </div>
        </div>

        {/* TOPIC DETAIL VIEWER - Takes 7 cols on lg */}
        <div className="lg:col-span-7">
          {selectedTopic !== null ? (
            /* ACTIVE ARTICLE VIEWER PANEL */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-natural-dark-card/40 border-natural-dark-border' : 'bg-white border-natural-border'}`}
            >
              {(() => {
                const art = ARTICLES.find(a => a.id === selectedTopic);
                if (!art) return null;
                return (
                  <>
                    <div className="border-b border-natural-border/20 pb-4">
                      <div className="flex items-center space-x-2 text-[10px] font-extrabold tracking-wider uppercase text-natural-primary">
                        <span>{art.category}</span>
                        <span>&bull;</span>
                        <span className="text-natural-muted">{art.readingTime}</span>
                      </div>
                      <h3 className="text-lg font-extrabold mt-2 leading-tight text-natural-primary">{art.title}</h3>
                    </div>

                    <div className={`text-xs leading-relaxed whitespace-pre-line space-y-4 ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                      {art.content}
                    </div>

                    <div className="flex border-t border-natural-border/20 pt-4 items-center justify-between text-xxs text-natural-muted">
                      <span className="flex items-center">
                        <BookmarkCheck className="w-3.5 h-3.5 mr-1 text-natural-primary" />
                        SDG 12 Complete Syllabus
                      </span>
                      <span>Verified Sustainable Factsheet</span>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ) : (
            /* BLANK STATE */
            <div className={`p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center text-natural-muted min-h-[380px] ${
              darkMode ? 'bg-natural-dark-card/15 border-natural-dark-border' : 'bg-natural-sand border-natural-border'
            }`}>
              <div className="p-3.5 bg-natural-primary/10 text-natural-primary rounded-full mb-4">
                <Compass className="w-8 h-8 animate-spin text-natural-primary" />
              </div>
              <h3 className="font-bold text-sm text-natural-dark dark:text-natural-dark-text">Choose a sustainable topic</h3>
              <p className="text-xs text-natural-muted mt-1.5 max-w-xs leading-relaxed">
                Select one of the validated eco-guides in the list on the left to read deep materials about single-use plastic resin identification.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
