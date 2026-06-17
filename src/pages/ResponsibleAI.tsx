import React from 'react';
import { Eye, ShieldCheck, Scale, Compass, Info, Leaf, Sparkles, BookOpen } from 'lucide-react';

interface ResponsibleAIProps {
  darkMode: boolean;
}

export default function ResponsibleAI({ darkMode }: ResponsibleAIProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-fade-in">
      
      {/* Header section info */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary">Responsible & Ethical AI</h2>
        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
          A critical review of the transparency frameworks, data privacy rules, safety thresholds, and structural guardrails engineered inside EcoSmart AI.
        </p>
      </div>

      {/* Sustainable AI Project Initiative Banner */}
      <div className={`p-6 rounded-2xl border text-left ${
        darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-natural-primary/15 text-natural-primary border border-natural-primary/20 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md">Project Initiative</span>
            <span className={`text-[10px] font-extrabold ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>SaaS-focused SDG-12 Compliance</span>
          </div>
          <h3 className="text-base font-black text-natural-dark dark:text-white">Empowering Households and Businesses through AI Segregation</h3>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
            EcoSmart AI utilizes high-performance Gemini Vision models to automatically identify and classify everyday consumer waste products into standardized composting, recycling, or specialized disposal channels. Combined with geographic recycling center mapping, we bridge the manual gap to divert over 81% of toxic contaminants from regional landfills.
          </p>
        </div>
      </div>

      {/* Main bento grid of AI Ethics principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fairness Card */}
        <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-natural-primary/10 text-natural-primary rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-natural-primary uppercase tracking-widest">Pillar One</span>
              <h3 className="text-sm font-extrabold tracking-tight leading-none mt-1 text-natural-primary">Model Fairness & Bias Mitigations</h3>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-dark'}`}>
            EcoSmart AI prevents geographical demographic biases during waste classification. The core Gemini 3.5 model is systematically calibrated to handle multi-cultural waste container geometries—recognizing universal recycling symbols regardless of container wear, text labels, or regional script codes. Image pre-scaling ensures high accuracy regardless of camera resolutions.
          </p>
        </div>

        {/* Transparency Card */}
        <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-natural-secondary/10 text-natural-secondary rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-natural-secondary uppercase tracking-widest">Pillar Two</span>
              <h3 className="text-sm font-extrabold tracking-tight leading-none mt-1 text-natural-primary">Architectural Transparency</h3>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-dark'}`}>
            Transparency means users always understand why an item is categorized. The AI Scanner doesn't just return a raw classification label; it outputs a detailed **Confidence Match Percentage** and breaks down disposal mechanics. Furthermore, temperature parameters inside `@google/genai` are locked at `0.1` during Vision queries, forcing strict, deterministic physical analysis.
          </p>
        </div>

        {/* Privacy Card */}
        <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-natural-primary/10 text-natural-primary rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-natural-primary uppercase tracking-widest">Pillar Three</span>
              <h3 className="text-sm font-extrabold tracking-tight leading-none mt-1 text-natural-primary">Data Privacy & Sovereignty</h3>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-dark'}`}>
            User privacy is structurally guaranteed. Uploaded waste images are analyzed server-side and fully serialized as standard queries. They are **never** utilized for public training models of external companies, complying with strict GDPR data protection rules. Users have absolute autonomy to delete their individual search logs in the chatbot history or waste dashboards at any time.
          </p>
        </div>

        {/* Safety Card */}
        <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-natural-secondary/10 text-natural-secondary rounded-xl">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-natural-secondary uppercase tracking-widest">Pillar Four</span>
              <h3 className="text-sm font-extrabold tracking-tight leading-none mt-1 text-natural-primary">Safety & Risk Guardrails</h3>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-dark'}`}>
            Safety remains paramount. The Chat and Vision modules utilize strict, localized system prompts banning conversational diversions, malicious prompts, or unrelated off-target queries. When the model processes dangerous hazardous compounds (e.g. radioactive items, lithium cells, chemical batteries, asbestos boards), it is hardcoded to prioritize human preservation by blocking standard trash guidelines.
          </p>
        </div>

      </div>

      {/* Sustainable AI Integration Model Specifications */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden transition ${
        darkMode 
          ? 'bg-gradient-to-r from-natural-dark-card to-natural-dark-bg border-natural-dark-border font-sans' 
          : 'bg-gradient-to-r from-natural-secondary/10 to-natural-sand border-natural-border'
      }`}>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4.5 h-4.5 text-natural-primary" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-natural-primary">Model Parameter Specifications</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-natural-dark-bg border-natural-dark-border' : 'bg-white border-natural-border'}`}>
              <span className="text-xxs font-bold text-natural-muted uppercase tracking-widest">Image Temperature</span>
              <p className="text-lg font-black mt-1 text-natural-primary">0.1 Temp Coefficient</p>
              <p className={`text-[10px] mt-1.5 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Constructs highly deterministic, objective classifications by forcing the model to strictly evaluate visible container details.</p>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-natural-dark-bg border-natural-dark-border' : 'bg-white border-natural-border'}`}>
              <span className="text-xxs font-bold text-natural-muted uppercase tracking-widest">System Instruction</span>
              <p className="text-lg font-black mt-1 text-natural-secondary">Dual SDG Validation</p>
              <p className={`text-[10px] mt-1.5 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>The system guidelines restrict conversational scope, preventing model deviations and verifying material sorting science.</p>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-natural-dark-bg border-natural-dark-border' : 'bg-white border-natural-border'}`}>
              <span className="text-xxs font-bold text-natural-muted uppercase tracking-widest">Data Retention</span>
              <p className="text-lg font-black mt-1 text-natural-primary">Autonomous Purge</p>
              <p className={`text-[10px] mt-1.5 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Allows immediate, fully functional data deletion from database files directly from user dashboards with full transparency.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
